package com.micoz.inquiry.repository;

import com.micoz.inquiry.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InquiryRepository extends JpaRepository<Inquiry, Long>, JpaSpecificationExecutor<Inquiry> {

    boolean existsByInquiryNo(String inquiryNo);

    Optional<Inquiry> findByInquirySeqAndUserSeqAndUseYn(Long inquirySeq, Long userSeq, String useYn);

    Page<Inquiry> findAllByUserSeqAndUseYn(Long userSeq, String useYn, Pageable pageable);

    default Optional<Inquiry> findActiveByInquirySeqAndUserSeq(Long inquirySeq, Long userSeq) {
        return findByInquirySeqAndUserSeqAndUseYn(inquirySeq, userSeq, "Y");
    }
}
