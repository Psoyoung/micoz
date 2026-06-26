package com.micoz.admin.member.service;

import com.micoz.admin.member.dto.CreateMemberRequest;
import com.micoz.admin.member.dto.MemberCreatedResponse;
import com.micoz.admin.member.dto.MemberDetailResponse;
import com.micoz.admin.member.dto.MemberListItem;
import com.micoz.admin.member.dto.MemberSearchCondition;
import com.micoz.admin.member.dto.PointAdjustResponse;
import com.micoz.admin.member.spec.UserSpecs;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.common.response.PageResponse;
import com.micoz.promotion.entity.PointHistory;
import com.micoz.promotion.repository.PointHistoryRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 회원 목록·다축 검색 (M-T1). UserSpecs + MemberSearchCondition 패턴을 사용한다.
 * 회원(CUSTOMER)만 노출 — roleEq("CUSTOMER") 고정으로 ADMIN 행은 결과에 섞이지 않는다.
 */
@Service
@RequiredArgsConstructor
public class AdminMemberService {

    private static final String ROLE_CUSTOMER = "CUSTOMER";
    private static final String DEFAULT_GRADE_CODE = "MEMBER";

    /** 허용 운영 상태 (M-Q1 확정: WITHDRAWN 제외. 탈퇴는 use_yn 단독 표현). */
    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "DORMANT", "SUSPENDED");

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
    private final PointHistoryRepository pointHistoryRepository;
    private final PasswordEncoder passwordEncoder;

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

    /**
     * 회원 상세 (M-T2). 대상이 CUSTOMER가 아니면 USER_NOT_FOUND(관리자 계정은 비노출).
     * 비밀번호는 응답에 포함하지 않는다.
     */
    @Transactional(readOnly = true)
    public MemberDetailResponse getDetail(Long userSeq) {
        User user = findCustomerOrThrow(userSeq);

        String gradeCode = null;
        String gradeName = null;
        if (user.getGradeSeq() != null) {
            UserGrade grade = userGradeRepository.findById(user.getGradeSeq()).orElse(null);
            if (grade != null) {
                gradeCode = grade.getGradeCode();
                gradeName = grade.getGradeName();
            }
        }

        String referrerUserId = null;
        if (user.getReferrerUserSeq() != null) {
            referrerUserId = userRepository.findById(user.getReferrerUserSeq())
                    .map(User::getUserId)
                    .orElse(null);
        }

        return MemberDetailResponse.builder()
                .userSeq(user.getUserSeq())
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userRole(user.getUserRole())
                .gradeCode(gradeCode)
                .gradeName(gradeName)
                .userStatus(user.getUserStatus())
                .useYn(user.getUseYn())
                .email(user.getEmail())
                .phone(user.getPhone())
                .birthDate(user.getBirthDate())
                .zipCode(user.getZipCode())
                .address(user.getAddress())
                .addressDetail(user.getAddressDetail())
                .memo(user.getMemo())
                .pointBalance(user.getPointBalance())
                .serviceYn(user.getServiceYn())
                .privacyYn(user.getPrivacyYn())
                .marketingYn(user.getMarketingYn())
                .referrerUserId(referrerUserId)
                .lastLoginDate(user.getLastLoginDate())
                .joinedDate(user.getIDate())
                .build();
    }

    /**
     * 회원 등록 (M-T4). userId 중복 시 USER_DUPLICATED_ID, 미존재 등급 시 GRADE_NOT_FOUND.
     * 비밀번호는 즉시 BCrypt(12) 해시(평문 미저장). role=CUSTOMER, 미지정 등급은 MEMBER.
     */
    @Transactional
    public MemberCreatedResponse createMember(CreateMemberRequest request) {
        if (userRepository.existsActiveByUserId(request.getUserId())) {
            throw new BusinessException(ErrorCode.USER_DUPLICATED_ID);
        }
        String gradeCode = (request.getGradeCode() == null || request.getGradeCode().isBlank())
                ? DEFAULT_GRADE_CODE : request.getGradeCode().trim();
        UserGrade grade = userGradeRepository.findActiveByGradeCode(gradeCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.GRADE_NOT_FOUND));

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        User member = User.builder()
                .userId(request.getUserId())
                .userPw(passwordEncoder.encode(request.getUserPw()))
                .userName(request.getUserName())
                .userRole(ROLE_CUSTOMER)
                .gradeSeq(grade.getGradeSeq())
                .email(blankToNull(request.getEmail()))
                .phone(blankToNull(request.getPhone()))
                .serviceYn("Y")
                .privacyYn("Y")
                .marketingYn("N")
                .serviceAgreeDate(now)
                .privacyAgreeDate(now)
                .pointBalance(0)
                .userStatus("ACTIVE")
                .useYn("Y")
                .referrerUserSeq(null)
                .build();
        User saved = userRepository.save(member);
        return new MemberCreatedResponse(saved.getUserSeq(), saved.getUserId());
    }

    /** 회원 등급 변경 (M-T3). 유효 등급(use_yn='Y')이 아니면 GRADE_NOT_FOUND. */
    @Transactional
    public void changeGrade(Long userSeq, String gradeCode) {
        User member = findCustomerOrThrow(userSeq);
        UserGrade grade = userGradeRepository.findActiveByGradeCode(gradeCode.trim())
                .orElseThrow(() -> new BusinessException(ErrorCode.GRADE_NOT_FOUND));
        member.changeGrade(grade.getGradeSeq());
    }

    /**
     * 회원 운영 상태 변경 (M-T3). 허용값(ACTIVE/DORMANT/SUSPENDED) 외면 MEMBER_INVALID_STATUS.
     * use_yn(탈퇴)은 건드리지 않는다.
     */
    @Transactional
    public void changeStatus(Long userSeq, String status) {
        User member = findCustomerOrThrow(userSeq);
        String normalized = status.trim().toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new BusinessException(ErrorCode.MEMBER_INVALID_STATUS);
        }
        member.changeStatus(normalized);
    }

    /**
     * 포인트 수동 조정 (M-T5, 참고용). amount 부호: 양수=적립(EARN)/음수=차감(USE).
     * 단일 트랜잭션 read-modify-write: 잔액 계산 → 음수면 POINT_INSUFFICIENT(롤백) →
     * his_point(append-only) 기록 + user.point_balance 갱신을 원자적으로 수행.
     */
    @Transactional
    public PointAdjustResponse adjustPoint(Long userSeq, Integer amount, String reason) {
        if (amount == null || amount == 0) {
            throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        User member = findCustomerOrThrow(userSeq);
        int current = member.getPointBalance() != null ? member.getPointBalance() : 0;
        // long으로 합산해 int 오버플로 제거. 새 잔액은 1회만 계산해 이력·현재잔액에 동일 적용.
        long projected = (long) current + amount;
        if (projected < 0) {
            throw new BusinessException(ErrorCode.POINT_INSUFFICIENT);
        }
        if (projected > Integer.MAX_VALUE) {
            throw new BusinessException(ErrorCode.COMMON_VALIDATION_ERROR); // point_balance(INTEGER) 상한 초과
        }
        int balanceAfter = (int) projected;

        PointHistory history = PointHistory.builder()
                .userSeq(userSeq)
                .pointType(amount > 0 ? "EARN" : "USE")
                .pointAmount(amount)
                .balanceAfter(balanceAfter)
                .reason(reason)
                .useYn("Y")
                .build();
        PointHistory saved = pointHistoryRepository.save(history);
        member.changePointBalance(balanceAfter);
        return new PointAdjustResponse(userSeq, balanceAfter, saved.getPointSeq());
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    /** 회원(CUSTOMER) 조회 — 미존재 또는 비CUSTOMER(관리자 등)면 USER_NOT_FOUND로 비노출. */
    private User findCustomerOrThrow(Long userSeq) {
        User user = userRepository.findById(userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!ROLE_CUSTOMER.equals(user.getUserRole())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
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
