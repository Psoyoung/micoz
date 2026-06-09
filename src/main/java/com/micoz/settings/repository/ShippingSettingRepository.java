package com.micoz.settings.repository;

import com.micoz.settings.entity.ShippingSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShippingSettingRepository extends JpaRepository<ShippingSetting, Long> {

    Optional<ShippingSetting> findFirstByOrderByShipSeqAsc();
}
