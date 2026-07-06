package com.micoz.admin.inquiry.service;

import com.micoz.admin.inquiry.dto.CreateReplyRequest;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.inquiry.entity.Inquiry;
import com.micoz.inquiry.entity.InquiryReply;
import com.micoz.inquiry.repository.InquiryReplyRepository;
import com.micoz.inquiry.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * 문의 응대 처리 (CS-T3, FR-ADM-07). 답변 등록 = append(다중답변 허용, CS-Q②) + WAITING→ANSWERED 최초 전이.
 * <b>재답변 시 answeredDate는 불변</b>(최초값 고정) — 갱신하면 D 대시보드 응답시간/SLA 집계가 흔들림.
 * 답변은 append-only(§3.4, CS-Q①): {@link InquiryReply#create}만 사용, 수정/삭제 없음. 관리자는 전 회원 문의 대상.
 */
@Service
@RequiredArgsConstructor
public class AdminInquiryService {

    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository inquiryReplyRepository;

    /**
     * 답변 등록: 답변 append + 최초 답변일 때만 WAITING→ANSWERED 전이(answeredDate 기록). 단일 @Transactional 원자.
     * 이미 ANSWERED면 답변만 append하고 상태·answeredDate 불변(CS-Q②).
     *
     * @param adminSeq 인증된 관리자 user_seq(dat_inquiry_reply.admin_seq)
     */
    @Transactional
    public void reply(Long inquirySeq, Long adminSeq, CreateReplyRequest request) {
        Inquiry inquiry = inquiryRepository.findById(inquirySeq)
                .filter(i -> "Y".equals(i.getUseYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));

        inquiryReplyRepository.save(InquiryReply.create(inquirySeq, adminSeq, request.getContent()));

        // WAITING일 때만 최초 전이. 이미 ANSWERED면 changeStatus 미호출 → answeredDate 최초값 고정.
        if ("WAITING".equals(inquiry.getInquiryStatus())) {
            inquiry.markAnswered(OffsetDateTime.now());
        }
    }
}
