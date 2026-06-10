package com.micoz.inquiry.repository;

import com.micoz.inquiry.entity.InquiryReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryReplyRepository extends JpaRepository<InquiryReply, Long> {

    List<InquiryReply> findAllByInquirySeqAndUseYnOrderByReplySeqAsc(Long inquirySeq, String useYn);

    default List<InquiryReply> findActiveByInquirySeq(Long inquirySeq) {
        return findAllByInquirySeqAndUseYnOrderByReplySeqAsc(inquirySeq, "Y");
    }
}
