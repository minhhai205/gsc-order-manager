package com.httt.gsc_order_manager.dto.backup;

import com.httt.gsc_order_manager.entity.enums.RestoreStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RestoreRecordResponse {

    private Long id;
    private String restoreCode;
    private Long backupRecordId;
    private String backupCode;
    private RestoreStatus status;
    private Instant startedAt;
    private Instant completedAt;
    private String performedBy;
    private String note;
    private String failureReason;
    private Instant createdAt;
    private Instant updatedAt;
}
