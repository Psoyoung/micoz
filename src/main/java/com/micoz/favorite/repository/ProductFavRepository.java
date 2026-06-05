package com.micoz.favorite.repository;

import com.micoz.favorite.entity.ProductFav;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductFavRepository
        extends JpaRepository<ProductFav, ProductFav.ProductFavId> {

    Page<ProductFav> findAllByUserSeq(Long userSeq, Pageable pageable);
}
