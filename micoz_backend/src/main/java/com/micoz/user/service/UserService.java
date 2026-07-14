package com.micoz.user.service;

import com.micoz.auth.entity.RefreshToken;
import com.micoz.auth.repository.RefreshTokenRepository;
import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.user.dto.ChangePasswordRequest;
import com.micoz.user.dto.UpdateUserRequest;
import com.micoz.user.dto.UserInfoResponse;
import com.micoz.user.entity.User;
import com.micoz.user.entity.UserGrade;
import com.micoz.user.repository.UserGradeRepository;
import com.micoz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserGradeRepository userGradeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserInfoResponse getMe(Long userSeq) {
        User user = userRepository.findById(userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!"Y".equals(user.getUseYn())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

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

        return UserInfoResponse.builder()
                .userSeq(user.getUserSeq())
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userRole(user.getUserRole())
                .userStatus(user.getUserStatus())
                .email(user.getEmail())
                .phone(user.getPhone())
                .birthDate(user.getBirthDate())
                .zipCode(user.getZipCode())
                .address(user.getAddress())
                .addressDetail(user.getAddressDetail())
                .gradeCode(gradeCode)
                .gradeName(gradeName)
                .referrerUserId(referrerUserId)
                .pointBalance(user.getPointBalance())
                .lastLoginDate(user.getLastLoginDate())
                .build();
    }

    @Transactional
    public UserInfoResponse updateMe(Long userSeq, UpdateUserRequest request) {
        User user = userRepository.findById(userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!"Y".equals(user.getUseYn())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        user.updateProfile(
                request.getUserName(),
                request.getEmail(),
                request.getPhone(),
                request.getBirthDate(),
                request.getZipCode(),
                request.getAddress(),
                request.getAddressDetail()
        );
        return getMe(userSeq);
    }

    @Transactional
    public void changePassword(Long userSeq, ChangePasswordRequest request) {
        User user = userRepository.findById(userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!"Y".equals(user.getUseYn())) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getUserPw())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        user.changePassword(passwordEncoder.encode(request.getNewPassword()));

        // 본인의 모든 활성 refresh revoke (FR-MY-01)
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<RefreshToken> active = refreshTokenRepository.findActiveByUserSeq(userSeq);
        active.forEach(t -> t.revoke(now));
    }
}
