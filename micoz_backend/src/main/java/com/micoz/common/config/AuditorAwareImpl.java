package com.micoz.common.config;

import com.micoz.auth.security.UserPrincipal;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("auditorAware")
public class AuditorAwareImpl implements AuditorAware<String> {

    private static final String SYSTEM = "SYSTEM";
    private static final String ANONYMOUS = "anonymousUser";

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.of(SYSTEM);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal up) {
            return Optional.of(up.getUserId());
        }
        String name = authentication.getName();
        if (name == null || name.isBlank() || ANONYMOUS.equals(name)) {
            return Optional.of(SYSTEM);
        }
        return Optional.of(name);
    }
}
