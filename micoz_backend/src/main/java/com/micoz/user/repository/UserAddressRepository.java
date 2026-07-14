package com.micoz.user.repository;

import com.micoz.user.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findAllByUserSeqAndUseYnOrderByDefaultYnDescAddressSeqDesc(Long userSeq, String useYn);

    Optional<UserAddress> findByAddressSeqAndUserSeqAndUseYn(Long addressSeq, Long userSeq, String useYn);

    List<UserAddress> findAllByUserSeqAndDefaultYnAndUseYn(Long userSeq, String defaultYn, String useYn);

    default List<UserAddress> findAllActiveByUserSeq(Long userSeq) {
        return findAllByUserSeqAndUseYnOrderByDefaultYnDescAddressSeqDesc(userSeq, "Y");
    }

    default Optional<UserAddress> findActiveByAddressSeqAndUserSeq(Long addressSeq, Long userSeq) {
        return findByAddressSeqAndUserSeqAndUseYn(addressSeq, userSeq, "Y");
    }
}
