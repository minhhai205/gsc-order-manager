package com.httt.gsc_order_manager.dto.backup;

import com.httt.gsc_order_manager.entity.enums.BackupType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBackupRequest {

    @NotNull
    private BackupType type;
}
