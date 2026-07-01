package com.micoz.admin.settings.service;

import com.micoz.admin.settings.dto.ShippingSettingResponse;
import com.micoz.admin.settings.dto.UpdateShippingRequest;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.settings.entity.ShippingSetting;
import com.micoz.settings.repository.ShippingSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 배송 설정 조회/수정 (S-T2, FR-ADM-09). 단일행 정본(ship_seq 최소 행)만 대상 — 주문 생성 경로
 * ({@code OrderService})가 읽는 행과 동일하게 {@code findFirstByOrderByShipSeqAsc()}로 통일한다.
 * 삭제/생성 API 없음(§3.4 단일행 = update-only).
 */
@Service
@RequiredArgsConstructor
public class AdminShippingSettingService {

    private final ShippingSettingRepository shippingSettingRepository;

    @Transactional(readOnly = true)
    public ShippingSettingResponse getSetting() {
        return toResponse(loadSingleton());
    }

    /** 부분 수정. 단일 트랜잭션(조회+수정). 정본 부재 시 SHIPPING_SETTING_NOT_FOUND(S-Q1=A). */
    @Transactional
    public void updateSetting(UpdateShippingRequest req) {
        ShippingSetting setting = loadSingleton();
        setting.updateSettings(
                req.getShippingName(),
                req.getShippingFee(),
                req.getFreeShippingMin(),
                req.getRemoteExtraFee(),
                req.getShippingNotice());
    }

    private ShippingSetting loadSingleton() {
        return shippingSettingRepository.findFirstByOrderByShipSeqAsc()
                .orElseThrow(() -> new BusinessException(ErrorCode.SHIPPING_SETTING_NOT_FOUND));
    }

    private ShippingSettingResponse toResponse(ShippingSetting s) {
        return ShippingSettingResponse.builder()
                .shipSeq(s.getShipSeq())
                .shippingName(s.getShippingName())
                .shippingFee(s.getShippingFee())
                .freeShippingMin(s.getFreeShippingMin())
                .remoteExtraFee(s.getRemoteExtraFee())
                .shippingNotice(s.getShippingNotice())
                .updatedAt(s.getUDate())
                .updatedBy(s.getUUser())
                .build();
    }
}
