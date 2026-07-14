package com.micoz.admin.inquiry.service;

import com.micoz.admin.inquiry.dto.AdminInquiryDetailResponse;
import com.micoz.admin.inquiry.dto.AdminInquiryListItem;
import com.micoz.admin.inquiry.dto.AdminInquiryReplyDto;
import com.micoz.admin.inquiry.dto.AdminInquirySearchCondition;
import com.micoz.admin.inquiry.spec.InquirySpecs;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.inquiry.entity.Inquiry;
import com.micoz.inquiry.entity.InquiryReply;
import com.micoz.inquiry.repository.InquiryReplyRepository;
import com.micoz.inquiry.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 관리자 문의 조회 (CS-T2, FR-ADM-07). 목록(다축 검색·정렬 화이트리스트) + 상세.
 * <b>관리자는 전 회원 문의를 본다</b> — 사용자측 {@code InquiryService}의 본인-행 제약(user_seq)과 달리 {@code findById}로
 * 조회하고, 비공개({@code private_yn='Y'})도 노출한다. 목록의 {@code hasReply}는 상태 파생(ANSWERED)이라 행별 조회가 없어
 * N+1이 원천 차단된다(statement 상수). 상세의 답변은 단건 조회 1회.
 */
@Service
@RequiredArgsConstructor
public class AdminInquiryQueryService {

    /** 정렬 화이트리스트(API 키 → 엔티티 속성). 미허용 키는 400. 문의 전용 일자컬럼 없어 iDate(등록일) 사용. */
    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "inquirySeq", "inquirySeq",
            "iDate", "iDate");

    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository inquiryReplyRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminInquiryListItem> search(AdminInquirySearchCondition condition, Pageable pageable) {
        Specification<Inquiry> spec = Specification.where(InquirySpecs.useYnEq("Y"))
                .and(InquirySpecs.titleLike(condition.getQ()))
                .and(InquirySpecs.inquiryTypeEq(condition.getInquiryType()))
                .and(InquirySpecs.inquiryStatusEq(condition.getInquiryStatus()))
                .and(InquirySpecs.userSeqEq(condition.getUserSeq()))
                .and(InquirySpecs.privateYnEq(condition.getPrivateYn()))
                .and(InquirySpecs.createdGoe(condition.getDateFrom()))
                .and(InquirySpecs.createdLoe(condition.getDateTo()));

        Page<Inquiry> page = inquiryRepository.findAll(spec, sanitizeSort(pageable));
        List<AdminInquiryListItem> content = page.getContent().stream()
                .map(i -> AdminInquiryListItem.builder()
                        .inquirySeq(i.getInquirySeq())
                        .inquiryNo(i.getInquiryNo())
                        .userSeq(i.getUserSeq())
                        .inquiryType(i.getInquiryType())
                        .title(i.getTitle())
                        .inquiryStatus(i.getInquiryStatus())
                        .privateYn(i.getPrivateYn())
                        .hasReply("ANSWERED".equals(i.getInquiryStatus()))
                        .createdDate(i.getIDate())
                        .answeredDate(i.getAnsweredDate())
                        .build())
                .toList();
        return PageResponse.of(content, page);
    }

    @Transactional(readOnly = true)
    public AdminInquiryDetailResponse getDetail(Long inquirySeq) {
        Inquiry inquiry = inquiryRepository.findById(inquirySeq)
                .filter(i -> "Y".equals(i.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));

        List<AdminInquiryReplyDto> replies = inquiryReplyRepository.findActiveByInquirySeq(inquirySeq).stream()
                .map(this::toReplyDto)
                .toList();

        return AdminInquiryDetailResponse.builder()
                .inquirySeq(inquiry.getInquirySeq())
                .inquiryNo(inquiry.getInquiryNo())
                .userSeq(inquiry.getUserSeq())
                .inquiryType(inquiry.getInquiryType())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .productSeq(inquiry.getProductSeq())
                .orderSeq(inquiry.getOrderSeq())
                .inquiryStatus(inquiry.getInquiryStatus())
                .privateYn(inquiry.getPrivateYn())
                .createdDate(inquiry.getIDate())
                .answeredDate(inquiry.getAnsweredDate())
                .replies(replies)
                .build();
    }

    private AdminInquiryReplyDto toReplyDto(InquiryReply r) {
        return AdminInquiryReplyDto.builder()
                .replySeq(r.getReplySeq())
                .adminSeq(r.getAdminSeq())
                .content(r.getContent())
                .createdDate(r.getIDate())
                .build();
    }

    /** 정렬 화이트리스트 검증 — 미허용 키는 COMMON_INVALID_REQUEST(400). (AdminOrderQueryService 패턴) */
    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            return pageable;
        }
        List<Sort.Order> translated = new ArrayList<>();
        for (Sort.Order order : sort) {
            String mapped = SORT_WHITELIST.get(order.getProperty());
            if (mapped == null) {
                throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST);
            }
            translated.add(new Sort.Order(order.getDirection(), mapped));
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(translated));
    }
}
