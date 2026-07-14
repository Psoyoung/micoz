package com.micoz.user.entity;

import com.micoz.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "mst_user_grade")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserGrade extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grade_seq")
    private Long gradeSeq;

    @Column(name = "grade_code", nullable = false, length = 20)
    private String gradeCode;

    @Column(name = "grade_name", nullable = false, length = 100)
    private String gradeName;

    @Column(name = "point_rate", precision = 5, scale = 2)
    private BigDecimal pointRate;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "description", length = 500)
    private String description;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "use_yn", length = 1)
    private String useYn;
}
