package com.httt.gsc_order_manager.dto.rejectionletter;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarkSendFailedRequest {

    @Size(max = 500)
    private String reason;
}
