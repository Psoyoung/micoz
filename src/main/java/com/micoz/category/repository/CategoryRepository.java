package com.micoz.category.repository;

import com.micoz.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByUseYnAndDisplayYnOrderBySortOrderAsc(String useYn, String displayYn);

    default List<Category> findAllVisible() {
        return findAllByUseYnAndDisplayYnOrderBySortOrderAsc("Y", "Y");
    }
}
