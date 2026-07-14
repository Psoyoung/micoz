package com.micoz.inquiry.util;

import com.micoz.inquiry.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** IQ-{yyMMdd}-{NNNNN} 문의번호. */
@Component
@RequiredArgsConstructor
public class InquiryNoGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyMMdd");
    private static final int MAX_RETRY = 5;

    private final InquiryRepository inquiryRepository;

    public String next() {
        String prefix = "IQ-" + LocalDate.now().format(DATE_FMT) + "-";
        for (int attempt = 1; attempt <= MAX_RETRY; attempt++) {
            long seq = (System.nanoTime() + attempt) % 100000;
            String candidate = prefix + String.format("%05d", seq);
            if (!inquiryRepository.existsByInquiryNo(candidate)) {
                return candidate;
            }
        }
        return prefix + (System.nanoTime() % 100000);
    }
}
