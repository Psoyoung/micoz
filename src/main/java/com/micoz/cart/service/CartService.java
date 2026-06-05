package com.micoz.cart.service;

import com.micoz.cart.dto.AddCartRequest;
import com.micoz.cart.dto.CartItemResponse;
import com.micoz.cart.dto.CartListResponse;
import com.micoz.cart.entity.Cart;
import com.micoz.cart.repository.CartRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.product.entity.Product;
import com.micoz.product.entity.ProductImage;
import com.micoz.product.entity.ProductOption;
import com.micoz.product.repository.ProductImageRepository;
import com.micoz.product.repository.ProductOptionRepository;
import com.micoz.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final ProductImageRepository productImageRepository;

    @Transactional
    public CartItemResponse addToCart(Long userSeq, AddCartRequest request) {
        Product product = productRepository.findVisibleByProductSeq(request.getProductSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        List<ProductOption> activeOptions = productOptionRepository.findActiveByProductSeq(product.getProductSeq());
        ProductOption selectedOption = resolveOption(activeOptions, request.getOptionSeq());

        int newQty = request.getQuantity();
        Integer stockLimit = (selectedOption != null) ? selectedOption.getStockQty() : null;

        Cart existing = cartRepository.findByUserSeqAndProductSeqAndOptionSeq(
                userSeq, product.getProductSeq(), request.getOptionSeq()).orElse(null);

        Cart saved;
        if (existing != null) {
            int merged = existing.getQuantity() + newQty;
            assertStock(stockLimit, merged);
            existing.addQuantity(newQty);
            saved = existing;
        } else {
            assertStock(stockLimit, newQty);
            saved = cartRepository.save(Cart.builder()
                    .userSeq(userSeq)
                    .productSeq(product.getProductSeq())
                    .optionSeq(request.getOptionSeq())
                    .quantity(newQty)
                    .build());
        }

        return buildResponse(saved, product, selectedOption);
    }

    @Transactional(readOnly = true)
    public CartListResponse getMyCart(Long userSeq) {
        List<Cart> carts = cartRepository.findAllByUserSeq(userSeq);
        if (carts.isEmpty()) {
            return new CartListResponse(List.of(), 0, BigDecimal.ZERO);
        }

        List<Long> productSeqs = carts.stream().map(Cart::getProductSeq).distinct().toList();
        List<Long> optionSeqs = carts.stream().map(Cart::getOptionSeq).filter(Objects::nonNull).distinct().toList();

        Map<Long, Product> productById = productRepository.findAllById(productSeqs).stream()
                .collect(Collectors.toMap(Product::getProductSeq, p -> p));
        Map<Long, ProductOption> optionById = optionSeqs.isEmpty()
                ? Map.of()
                : productOptionRepository.findAllById(optionSeqs).stream()
                        .collect(Collectors.toMap(ProductOption::getOptionSeq, o -> o));
        Map<Long, String> mainImageByProduct = loadMainImages(productSeqs);

        List<CartItemResponse> items = new java.util.ArrayList<>(carts.size());
        BigDecimal total = BigDecimal.ZERO;
        for (Cart cart : carts) {
            Product product = productById.get(cart.getProductSeq());
            if (product == null) continue; // 상품 비활성/삭제 — 카트 항목 무시
            ProductOption option = (cart.getOptionSeq() != null) ? optionById.get(cart.getOptionSeq()) : null;
            BigDecimal unitPrice = (option != null) ? option.getFinalPrice() : product.getBasePrice();
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(cart.getQuantity()));

            items.add(CartItemResponse.builder()
                    .cartSeq(cart.getCartSeq())
                    .productSeq(product.getProductSeq())
                    .productCode(product.getProductCode())
                    .productName(product.getProductName())
                    .optionSeq(option != null ? option.getOptionSeq() : null)
                    .optionName(option != null ? option.getOptionName() : null)
                    .unitPrice(unitPrice)
                    .quantity(cart.getQuantity())
                    .itemTotal(itemTotal)
                    .mainImageUrl(mainImageByProduct.get(product.getProductSeq()))
                    .build());
            total = total.add(itemTotal);
        }
        return new CartListResponse(items, items.size(), total);
    }

    private Map<Long, String> loadMainImages(List<Long> productSeqs) {
        Map<Long, String> result = new HashMap<>();
        productImageRepository.findAllByProductSeqInAndImageTypeAndUseYn(productSeqs, "MAIN", "Y").stream()
                .sorted(Comparator.comparing(ProductImage::getSortOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(img -> result.putIfAbsent(img.getProductSeq(), img.getImageUrl()));
        return result;
    }

    @Transactional
    public CartItemResponse updateQuantity(Long userSeq, Long cartSeq, int newQty) {
        Cart cart = cartRepository.findByCartSeqAndUserSeq(cartSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        Product product = productRepository.findVisibleByProductSeq(cart.getProductSeq())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductOption option = null;
        if (cart.getOptionSeq() != null) {
            option = productOptionRepository.findById(cart.getOptionSeq())
                    .filter(o -> "Y".equals(o.getUseYn()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.CART_OPTION_REQUIRED));
            if (newQty > option.getStockQty()) {
                throw new BusinessException(ErrorCode.PRODUCT_SOLD_OUT);
            }
        }
        cart.changeQuantity(newQty);
        return buildResponse(cart, product, option);
    }

    @Transactional
    public void delete(Long userSeq, Long cartSeq) {
        Cart cart = cartRepository.findByCartSeqAndUserSeq(cartSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        cartRepository.delete(cart);
    }

    private ProductOption resolveOption(List<ProductOption> activeOptions, Long requestedOptionSeq) {
        boolean hasOptions = !activeOptions.isEmpty();
        if (hasOptions) {
            if (requestedOptionSeq == null) {
                throw new BusinessException(ErrorCode.CART_OPTION_REQUIRED);
            }
            return activeOptions.stream()
                    .filter(o -> o.getOptionSeq().equals(requestedOptionSeq))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(ErrorCode.CART_OPTION_REQUIRED));
        }
        // 옵션 없는 상품에 optionSeq 지정도 부정
        if (requestedOptionSeq != null) {
            throw new BusinessException(ErrorCode.CART_OPTION_REQUIRED);
        }
        return null;
    }

    private void assertStock(Integer stockLimit, int requestedQty) {
        if (stockLimit == null) return;
        if (requestedQty > stockLimit) {
            throw new BusinessException(ErrorCode.PRODUCT_SOLD_OUT);
        }
    }

    private CartItemResponse buildResponse(Cart cart, Product product, ProductOption option) {
        BigDecimal unitPrice = (option != null) ? option.getFinalPrice() : product.getBasePrice();
        BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(cart.getQuantity()));
        String mainImageUrl = productImageRepository.findActiveMainByProductSeq(product.getProductSeq()).stream()
                .min(Comparator.comparing(ProductImage::getSortOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ProductImage::getImageUrl)
                .orElse(null);

        return CartItemResponse.builder()
                .cartSeq(cart.getCartSeq())
                .productSeq(product.getProductSeq())
                .productCode(product.getProductCode())
                .productName(product.getProductName())
                .optionSeq(option != null ? option.getOptionSeq() : null)
                .optionName(option != null ? option.getOptionName() : null)
                .unitPrice(unitPrice)
                .quantity(cart.getQuantity())
                .itemTotal(itemTotal)
                .mainImageUrl(mainImageUrl)
                .build();
    }
}
