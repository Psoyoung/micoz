import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { analyticsService, AnalyticsMetrics } from '../../services/analyticsService';

const DashboardContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  min-height: 100vh;
`;

const DashboardHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const DashboardTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const DashboardSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const DateRangeSelector = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  align-items: center;
`;

const DateInput = styled.input`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RefreshButton = styled.button`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const MetricCard = styled(motion.div)`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const MetricLabel = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const MetricChange = styled.div<{ positive?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ positive, theme }) => 
    positive ? theme.colors.green[600] : theme.colors.red[600]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
`;

const ChartCard = styled(motion.div)`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[8]};
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary.sage};
  border-radius: 50%;
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.red[50]};
  color: ${({ theme }) => theme.colors.red[600]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  border: 1px solid ${({ theme }) => theme.colors.red[200]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadMetrics();
  }, [startDate, endDate]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const metricsData = await analyticsService.getAnalyticsMetrics(
        new Date(startDate),
        new Date(endDate)
      );
      setMetrics(metricsData);
    } catch (err) {
      setError('분석 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(1) + '%';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardContainer className={className}>
        <LoadingContainer>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </LoadingContainer>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer className={className}>
      <DashboardHeader>
        <DashboardTitle>분석 대시보드</DashboardTitle>
        <DashboardSubtitle>
          검색 및 추천 시스템의 성과를 확인하고 최적화하세요
        </DashboardSubtitle>
      </DashboardHeader>

      <DateRangeSelector>
        <div>
          <label htmlFor="start-date">시작일:</label>
          <DateInput
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end-date">종료일:</label>
          <DateInput
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <RefreshButton onClick={loadMetrics} disabled={loading}>
          새로고침
        </RefreshButton>
      </DateRangeSelector>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {metrics && (
        <>
          <MetricsGrid>
            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <MetricLabel>총 이벤트</MetricLabel>
              <MetricValue>{formatNumber(metrics.totalEvents)}</MetricValue>
              <MetricChange positive>
                +12.5% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MetricLabel>고유 사용자</MetricLabel>
              <MetricValue>{formatNumber(metrics.uniqueUsers)}</MetricValue>
              <MetricChange positive>
                +8.3% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <MetricLabel>검색 쿼리</MetricLabel>
              <MetricValue>{formatNumber(metrics.searchQueries)}</MetricValue>
              <MetricChange positive>
                +15.7% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <MetricLabel>검색 클릭률</MetricLabel>
              <MetricValue>{formatPercentage(metrics.searchClickThrough)}</MetricValue>
              <MetricChange positive>
                +2.1% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <MetricLabel>추천 클릭</MetricLabel>
              <MetricValue>{formatNumber(metrics.recommendationClicks)}</MetricValue>
              <MetricChange positive>
                +18.9% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <MetricLabel>전환율</MetricLabel>
              <MetricValue>{formatPercentage(metrics.conversionRate)}</MetricValue>
              <MetricChange>
                +3.2% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <MetricLabel>평균 세션 시간</MetricLabel>
              <MetricValue>{formatDuration(metrics.averageSessionDuration)}</MetricValue>
              <MetricChange positive>
                +5.8% 지난 기간 대비
              </MetricChange>
            </MetricCard>

            <MetricCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <MetricLabel>이탈률</MetricLabel>
              <MetricValue>{formatPercentage(metrics.bounceRate)}</MetricValue>
              <MetricChange>
                -1.3% 지난 기간 대비
              </MetricChange>
            </MetricCard>
          </MetricsGrid>

          <ChartsGrid>
            <ChartCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <ChartTitle>검색 트렌드</ChartTitle>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                차트 구현 예정
              </div>
            </ChartCard>

            <ChartCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <ChartTitle>추천 성과</ChartTitle>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                차트 구현 예정
              </div>
            </ChartCard>

            <ChartCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <ChartTitle>전환 퍼널</ChartTitle>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                차트 구현 예정
              </div>
            </ChartCard>

            <ChartCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <ChartTitle>사용자 행동</ChartTitle>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                차트 구현 예정
              </div>
            </ChartCard>
          </ChartsGrid>
        </>
      )}
    </DashboardContainer>
  );
};