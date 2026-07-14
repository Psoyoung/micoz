package com.micoz.product.repository;

import com.micoz.product.entity.ProductLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductLabelRepository extends JpaRepository<ProductLabel, Long> {

    Optional<ProductLabel> findByLabelNameAndUseYn(String labelName, String useYn);

    List<ProductLabel> findAllByUseYnOrderBySortOrderAsc(String useYn);

    default Optional<ProductLabel> findActiveByLabelName(String labelName) {
        return findByLabelNameAndUseYn(labelName, "Y");
    }
}
