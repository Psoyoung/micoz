package com.micoz.order.service;

import com.micoz.cart.entity.Cart;
import com.micoz.cart.repository.CartRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.order.calculator.OrderAmount;
import com.micoz.order.calculator.OrderAmountCalculator;
import com.micoz.order.calculator.OrderItemInput;
import com.micoz.order.dto.CreateOrderRequest;
import com.micoz.order.dto.OrderCreatedResponse;
import com.micoz.order.entity.Order;
import com.micoz.order.entity.OrderItem;
import com.micoz.order.entity.OrderShipping;
import com.micoz.order.repository.OrderItemRepository;
import com.micoz.order.repository.OrderRepository;
import com.micoz.order.repository.OrderShippingRepository;
import com.micoz.order.util.OrderNoGenerator;
import com.micoz.product.entity.Product;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductOptionRepository;
import com.micoz.product.repository.ProductRepository;
import com.micoz.settings.entity.ShippingSetting;
import com.micoz.settings.repository.ShippingSettingRepository;
import com.micoz.user.entity.User;
import com.micoz.user.entity.UserAddress;
import com.micoz.user.entity.UserGrade;
import com.micoz.user.repository.UserAddressRepository;
import com.micoz.user.repository.UserGradeRepository;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final UserRepository userRepository;
    private final UserGradeRepository userGradeRepository;
    private final UserAddressRepository userAddressRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderShippingRepository orderShippingRepository;
    private final ShippingSettingRepository shippingSettingRepository;
    private final OrderAmountCalculator orderAmountCalculator;
    private final OrderNoGenerator orderNoGenerator;

    @Transactional
    public OrderCreatedResponse create(Long userSeq, CreateOrderRequest request) {
        // 1. 카트 항목 조회 (본인 행)
        if (request.getCartSeqs() == null || request.getCartSeqs().isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_EMPTY_ITEMS);
        }
        List<Cart> carts = cartRepository.findAllByCartSeqInAndUserSeq(request.getCartSeqs(), userSeq);
        if (carts.size() != request.getCartSeqs().size()) {
            throw new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND);
        }

        // 2. 상품/옵션 로드 (스냅샷 자료)
        List<Long> productSeqs = carts.stream().map(Cart::getProductSeq).distinct().toList();
        Map<Long, Product> productById = productRepository
                .findAllByProductSeqInAndUseYnAndDisplayYn(productSeqs, "Y", "Y").stream()
                .collect(Collectors.toMap(Product::getProductSeq, p -> p));
        if (productById.size() != productSeqs.size()) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        List<Long> optionSeqs = carts.stream().map(Cart::getOptionSeq).filter(Objects::nonNull).distinct().toList();
        Map<Long, ProductOption> optionById = optionSeqs.isEmpty()
                ? Map.of()
                : productOptionRepository.findAllById(optionSeqs).stream()
                        .filter(o -> "Y".equals(o.getUseYn()))
                        .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));

        // 3. 재고 검증 (차감은 결제 완료(PAID) 시점에 — M4-T6)
        for (Cart cart : carts) {
            if (cart.getOptionSeq() == null) continue;
            ProductOption option = optionById.get(cart.getOptionSeq());
            if (option == null) {
                throw new BusinessException(ErrorCode.CART_OPTION_REQUIRED);
            }
            if (cart.getQuantity() > option.getStockQty()) {
                throw new BusinessException(ErrorCode.PRODUCT_SOLD_OUT);
            }
        }

        // 4. 금액 계산
        List<OrderItemInput> inputs = carts.stream().map(c -> {
            BigDecimal unit = (c.getOptionSeq() != null)
                    ? optionById.get(c.getOptionSeq()).getFinalPrice()
                    : productById.get(c.getProductSeq()).getBasePrice();
            return new OrderItemInput(c.getProductSeq(), c.getOptionSeq(), unit, c.getQuantity());
        }).toList();

        ShippingSetting setting = shippingSettingRepository.findFirstByOrderByShipSeqAsc()
                .orElseThrow(() -> new IllegalStateException("Shipping setting not seeded"));

        BigDecimal pointRate = resolveGradePointRate(userSeq);

        OrderAmount calc = orderAmountCalculator.calculate(
                inputs, setting, Boolean.TRUE.equals(request.getIsRemote()),
                BigDecimal.ZERO, 0, pointRate);

        // 5. 클라이언트 금액 검증 (NFR-11)
        if (calc.getFinalAmount().compareTo(request.getClientAmount()) != 0) {
            throw new BusinessException(ErrorCode.ORDER_AMOUNT_MISMATCH);
        }

        // 6. 배송지 결정
        ShippingInfo shipping = resolveShipping(userSeq, request);

        // 7. 주문 저장
        String orderNo = orderNoGenerator.next();
        Order order = orderRepository.save(Order.builder()
                .orderNo(orderNo)
                .userSeq(userSeq)
                .orderStatus("PENDING")
                .shippingFee(calc.getShippingFee())
                .couponDiscount(BigDecimal.ZERO)
                .pointUsed(0)
                .totalDiscount(calc.getTotalDiscount())
                .finalAmount(calc.getFinalAmount())
                .pointToEarn(calc.getPointToEarn())
                .orderDate(OffsetDateTime.now())
                .build());

        // 8. 주문 상품 스냅샷 insert
        for (Cart cart : carts) {
            Product p = productById.get(cart.getProductSeq());
            ProductOption o = (cart.getOptionSeq() != null) ? optionById.get(cart.getOptionSeq()) : null;
            BigDecimal unitPrice = (o != null) ? o.getFinalPrice() : p.getBasePrice();
            BigDecimal itemAmount = unitPrice.multiply(BigDecimal.valueOf(cart.getQuantity()));
            orderItemRepository.save(OrderItem.builder()
                    .orderSeq(order.getOrderSeq())
                    .productSeq(p.getProductSeq())
                    .optionSeq(cart.getOptionSeq())
                    .productCode(p.getProductCode())
                    .productName(p.getProductName())
                    .optionName(o != null ? o.getOptionName() : null)
                    .unitPrice(unitPrice)
                    .quantity(cart.getQuantity())
                    .itemAmount(itemAmount)
                    .itemStatus("NORMAL")
                    .build());
        }

        // 9. 배송 정보 insert
        orderShippingRepository.save(OrderShipping.builder()
                .orderSeq(order.getOrderSeq())
                .recipientName(shipping.recipientName)
                .recipientPhone(shipping.recipientPhone)
                .zipCode(shipping.zipCode)
                .address(shipping.address)
                .addressDetail(shipping.addressDetail)
                .shippingMemo(shipping.shippingMemo)
                .shippingStatus("READY")
                .build());

        return OrderCreatedResponse.builder()
                .orderSeq(order.getOrderSeq())
                .orderNo(order.getOrderNo())
                .orderStatus(order.getOrderStatus())
                .itemsTotal(calc.getItemsTotal())
                .totalDiscount(calc.getTotalDiscount())
                .shippingFee(calc.getShippingFee())
                .finalAmount(calc.getFinalAmount())
                .pointToEarn(calc.getPointToEarn())
                .build();
    }

    private BigDecimal resolveGradePointRate(Long userSeq) {
        User user = userRepository.findById(userSeq).orElse(null);
        if (user == null || user.getGradeSeq() == null) return BigDecimal.ZERO;
        UserGrade grade = userGradeRepository.findById(user.getGradeSeq()).orElse(null);
        return (grade == null || grade.getPointRate() == null) ? BigDecimal.ZERO : grade.getPointRate();
    }

    private ShippingInfo resolveShipping(Long userSeq, CreateOrderRequest req) {
        if (req.getAddressSeq() != null) {
            UserAddress addr = userAddressRepository
                    .findActiveByAddressSeqAndUserSeq(req.getAddressSeq(), userSeq)
                    .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
            return new ShippingInfo(addr.getRecipientName(), addr.getRecipientPhone(),
                    addr.getZipCode(), addr.getAddress(), addr.getAddressDetail(),
                    req.getShippingMemo());
        }
        // 신규 입력
        if (isBlank(req.getRecipientName()) || isBlank(req.getRecipientPhone())
                || isBlank(req.getZipCode()) || isBlank(req.getAddress())) {
            throw new BusinessException(ErrorCode.ADDRESS_REQUIRED);
        }
        return new ShippingInfo(req.getRecipientName(), req.getRecipientPhone(),
                req.getZipCode(), req.getAddress(), req.getAddressDetail(),
                req.getShippingMemo());
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private record ShippingInfo(String recipientName, String recipientPhone, String zipCode,
                                String address, String addressDetail, String shippingMemo) {}
}
