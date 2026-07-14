package com.micoz.inquiry.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.inquiry.dto.CreateInquiryRequest;
import com.micoz.inquiry.dto.InquiryCreatedResponse;
import com.micoz.inquiry.dto.InquiryDetailResponse;
import com.micoz.inquiry.dto.InquiryListItem;
import com.micoz.inquiry.dto.InquiryReplyDto;
import com.micoz.inquiry.entity.Inquiry;
import com.micoz.inquiry.entity.InquiryReply;
import com.micoz.inquiry.repository.InquiryReplyRepository;
import com.micoz.inquiry.repository.InquiryRepository;
import com.micoz.inquiry.util.InquiryNoGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("PRODUCT", "ORDER", "DELIVERY", "RETURN", "ETC");

    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository inquiryReplyRepository;
    private final InquiryNoGenerator inquiryNoGenerator;

    @Transactional
    public InquiryCreatedResponse create(Long userSeq, CreateInquiryRequest request) {
        if (!ALLOWED_TYPES.contains(request.getInquiryType())) {
            throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        String privateYn = "Y".equals(request.getPrivateYn()) ? "Y" : "N";

        Inquiry inquiry = inquiryRepository.save(Inquiry.builder()
                .inquiryNo(inquiryNoGenerator.next())
                .userSeq(userSeq)
                .inquiryType(request.getInquiryType())
                .title(request.getTitle())
                .content(request.getContent())
                .productSeq(request.getProductSeq())
                .orderSeq(request.getOrderSeq())
                .inquiryStatus("WAITING")
                .privateYn(privateYn)
                .useYn("Y")
                .build());

        return InquiryCreatedResponse.builder()
                .inquirySeq(inquiry.getInquirySeq())
                .inquiryNo(inquiry.getInquiryNo())
                .inquiryStatus(inquiry.getInquiryStatus())
                .createdDate(inquiry.getIDate())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<InquiryListItem> getMyInquiries(Long userSeq, Pageable pageable) {
        Page<Inquiry> page = inquiryRepository.findAllByUserSeqAndUseYn(userSeq, "Y", pageable);
        List<InquiryListItem> content = page.getContent().stream()
                .map(i -> InquiryListItem.builder()
                        .inquirySeq(i.getInquirySeq())
                        .inquiryNo(i.getInquiryNo())
                        .inquiryType(i.getInquiryType())
                        .title(i.getTitle())
                        .inquiryStatus(i.getInquiryStatus())
                        .privateYn(i.getPrivateYn())
                        .createdDate(i.getIDate())
                        .hasReply("ANSWERED".equals(i.getInquiryStatus()))
                        .build())
                .toList();
        return PageResponse.of(content, page);
    }

    @Transactional(readOnly = true)
    public InquiryDetailResponse getDetail(Long userSeq, Long inquirySeq) {
        Inquiry inquiry = inquiryRepository.findActiveByInquirySeqAndUserSeq(inquirySeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));

        List<InquiryReplyDto> replies = inquiryReplyRepository.findActiveByInquirySeq(inquirySeq).stream()
                .map(r -> InquiryReplyDto.builder()
                        .replySeq(r.getReplySeq())
                        .content(r.getContent())
                        .createdDate(r.getIDate())
                        .build())
                .toList();

        return InquiryDetailResponse.builder()
                .inquirySeq(inquiry.getInquirySeq())
                .inquiryNo(inquiry.getInquiryNo())
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
}
