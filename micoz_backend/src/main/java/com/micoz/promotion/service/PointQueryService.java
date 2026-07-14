package com.micoz.promotion.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.promotion.dto.MyPointResponse;
import com.micoz.promotion.dto.PointHistoryItem;
import com.micoz.promotion.entity.PointHistory;
import com.micoz.promotion.repository.PointHistoryRepository;
import com.micoz.user.entity.User;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PointQueryService {

    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;

    @Transactional(readOnly = true)
    public MyPointResponse getMyPoints(Long userSeq, Pageable pageable) {
        User user = userRepository.findById(userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Page<PointHistory> page = pointHistoryRepository.findAllByUserSeqAndUseYn(userSeq, "Y", pageable);
        List<PointHistoryItem> items = page.getContent().stream()
                .map(p -> PointHistoryItem.builder()
                        .pointSeq(p.getPointSeq())
                        .pointType(p.getPointType())
                        .pointAmount(p.getPointAmount())
                        .balanceAfter(p.getBalanceAfter())
                        .reason(p.getReason())
                        .orderSeq(p.getOrderSeq())
                        .expireDate(p.getExpireDate())
                        .createdDate(p.getIDate())
                        .build())
                .toList();

        return new MyPointResponse(
                user.getPointBalance() != null ? user.getPointBalance() : 0,
                PageResponse.of(items, page));
    }
}
