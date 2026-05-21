package com.httt.gsc_order_manager.dto.agency;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAgencyRequest {

    @NotBlank
    @Size(max = 50)
    private String agencyCode;

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotBlank
    private String address;

    @NotBlank
    @Size(max = 150)
    private String contactName;

    @Size(max = 100)
    private String contactPosition;

    @Size(max = 30)
    private String contactPhone;

    @NotBlank
    @Email
    @Size(max = 150)
    private String contactEmail;
}
