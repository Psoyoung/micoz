package com.micoz.admin.member.service;

import com.micoz.admin.member.dto.MemberListItem;
import com.micoz.admin.member.dto.MemberSearchCondition;
import com.micoz.admin.member.spec.UserSpecs;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.user.entity.User;
import com.micoz.user.entity.UserGrade;
import com.micoz.user.repository.UserGradeRepository;
import com.micoz.user.repository.UserRepository;
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
import java.util.stream.Collectors;

/**
 * 회원 목록·다축 검색 (M-T1). UserSpecs + MemberSearchCondition 패턴을 사용한다.
 * 회원(CUSTOMER)만 노출 — roleEq("CUSTOMER") 고정으로 ADMIN 행은 결과에 섞이지 않는다.
 */
@Service
@RequiredArgsConstructor
public class AdminMemberService {

    private static final String ROLE_CUSTOMER = "CUSTOMER";

    /**
     * 정렬 화이트리스트: API 정렬키 → 엔티티 프로퍼티.
     * 목록에 없는 컬럼으로의 정렬 시도는 차단(임의 컬럼 정렬로 인한 오류·성능 사고 방지).
     */
    private static final Map<String, String> SORT_WHITELIST = Map.of(
            "userSeq", "userSeq",
            "userId", "userId",
            "userName", "userName",
            "pointBalance", "pointBalance",
            "lastLoginDate", "lastLoginDate",
            "joinedDate", "iDate",
            "userStatus", "userStatus"
    );

    private final UserRepository userRepository;
    private final UserGradeRepository userGradeRepository;

    @Transactional(readOnly = true)
    public PageResponse<MemberListItem> search(MemberSearchCondition condition, Pageable pageable) {
        // gradeCode → gradeSeq 변환 (스펙에 조인 불필요). 미존재 코드면 매칭 0건.
        Long gradeSeq = null;
        if (condition.getGradeCode() != null && !condition.getGradeCode().isBlank()) {
            UserGrade grade = userGradeRepository
                    .findActiveByGradeCode(condition.getGradeCode().trim())
                    .orElse(null);
            if (grade == null) {
                return PageResponse.of(Page.<MemberListItem>empty(pageable));
            }
            gradeSeq = grade.getGradeSeq();
        }

        Specification<User> spec = Specification.where(UserSpecs.roleEq(ROLE_CUSTOMER))
                .and(UserSpecs.keyword(condition.getQ()))
                .and(UserSpecs.userIdLike(condition.getUserId()))
                .and(UserSpecs.userNameLike(condition.getUserName()))
                .and(UserSpecs.gradeSeqEq(gradeSeq))
                .and(UserSpecs.statusEq(condition.getStatus()))
                .and(UserSpecs.joinedFrom(condition.getJoinedFrom()))
                .and(UserSpecs.joinedTo(condition.getJoinedTo()))
                .and(UserSpecs.activeOnly(condition.isIncludeDeleted()));

        Page<User> page = userRepository.findAll(spec, sanitizeSort(pageable));

        // 등급 일괄 조회(gradeSeq→gradeCode) — 목록 매핑 시 N+1 방지.
        Map<Long, String> gradeCodeBySeq = loadGradeCodeMap();
        List<MemberListItem> items = page.getContent().stream()
                .map(user -> toItem(user, gradeCodeBySeq))
                .toList();
        return PageResponse.of(items, page);
    }

    /** 정렬 프로퍼티를 화이트리스트로 검증·치환. 미허용 컬럼이면 400. */
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

    /** 등급 마스터 전체를 한 번에 조회해 seq→code 맵으로 (등급은 소수 — 목록 크기와 무관). */
    private Map<Long, String> loadGradeCodeMap() {
        return userGradeRepository.findAll().stream()
                .collect(Collectors.toMap(UserGrade::getGradeSeq, UserGrade::getGradeCode, (a, b) -> a));
    }

    private MemberListItem toItem(User user, Map<Long, String> gradeCodeBySeq) {
        String gradeCode = user.getGradeSeq() == null ? null : gradeCodeBySeq.get(user.getGradeSeq());
        return new MemberListItem(
                user.getUserSeq(),
                user.getUserId(),
                user.getUserName(),
                gradeCode,
                user.getPointBalance(),
                user.getUserStatus(),
                user.getUseYn(),
                user.getIDate(),
                user.getLastLoginDate());
    }
}
