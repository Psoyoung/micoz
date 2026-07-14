package com.micoz.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(max = 100)
    private String userName;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phone;

    private LocalDate birthDate;

    @Size(max = 10)
    private String zipCode;

    @Size(max = 500)
    private String address;

    @Size(max = 500)
    private String addressDetail;
}
