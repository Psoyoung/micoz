import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { abTestService, ABTest } from '../../services/abTestService';

const DashboardContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  min-height: 100vh;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const DashboardTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const CreateTestButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const TestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
`;

const TestCard = styled(motion.div)<{ status: string }>`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-left: 4px solid ${({ status, theme }) => {
    switch (status) {
      case 'active': return theme.colors.green[500];
      case 'completed': return theme.colors.blue[500];
      case 'inactive': return theme.colors.gray[400];
      default: return theme.colors.gray[300];
    }
  }};
`;

const TestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TestName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const TestStatus = styled.span<{ status: string }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  background: ${({ status, theme }) => {
    switch (status) {
      case 'active': return theme.colors.green[100];
      case 'completed': return theme.colors.blue[100];
      case 'inactive': return theme.colors.gray[100];
      default: return theme.colors.gray[100];
    }
  }};
  color: ${({ status, theme }) => {
    switch (status) {
      case 'active': return theme.colors.green[700];
      case 'completed': return theme.colors.blue[700];
      case 'inactive': return theme.colors.gray[700];
      default: return theme.colors.gray[700];
    }
  }};
`;

const TestDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const TestMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TestMetric = styled.div`
  text-align: center;
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const VariantsContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const VariantsTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const VariantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const VariantItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
`;

const VariantName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const VariantWeight = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary.sage};
`;

const TestActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  flex: 1;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary.sage};
          color: ${theme.colors.secondary.ivory};
          &:hover { background: ${theme.colors.primary.deepForest}; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.red[500]};
          color: white;
          &:hover { background: ${theme.colors.red[600]}; }
        `;
      default:
        return `
          background: ${theme.colors.gray[200]};
          color: ${theme.colors.gray[700]};
          &:hover { background: ${theme.colors.gray[300]}; }
        `;
    }
  }}
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export interface ABTestDashboardProps {
  className?: string;
}

export const ABTestDashboard: React.FC<ABTestDashboardProps> = ({
  className
}) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    setError(null);

    try {
      const activeTests = await abTestService.getActiveTests();
      setTests(activeTests);
    } catch (err) {
      setError('A/B 테스트 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load A/B tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async (testId: string) => {
    try {
      const results = await abTestService.getTestResults(testId);
      console.log('Test results:', results);
      // Navigate to detailed results page or show modal
    } catch (error) {
      console.error('Failed to get test results:', error);
    }
  };

  const handlePauseTest = async (testId: string) => {
    try {
      await abTestService.updateTest(testId, { status: 'inactive' });
      loadTests(); // Reload tests
    } catch (error) {
      console.error('Failed to pause test:', error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (window.confirm('정말로 이 테스트를 삭제하시겠습니까?')) {
      try {
        await abTestService.deleteTest(testId);
        loadTests(); // Reload tests
      } catch (error) {
        console.error('Failed to delete test:', error);
      }
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ko-KR');
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
        <DashboardTitle>A/B 테스트 대시보드</DashboardTitle>
        <CreateTestButton onClick={() => console.log('Create test')}>
          새 테스트 만들기
        </CreateTestButton>
      </DashboardHeader>

      {error && (
        <div style={{ color: 'red', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {tests.length === 0 ? (
        <EmptyState>
          <EmptyTitle>진행 중인 A/B 테스트가 없습니다</EmptyTitle>
          <EmptyDescription>
            새로운 A/B 테스트를 만들어 검색 및 추천 시스템을 최적화해보세요.
          </EmptyDescription>
          <CreateTestButton onClick={() => console.log('Create test')}>
            첫 번째 테스트 만들기
          </CreateTestButton>
        </EmptyState>
      ) : (
        <TestsGrid>
          {tests.map((test, index) => (
            <TestCard
              key={test.id}
              status={test.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TestHeader>
                <div>
                  <TestName>{test.name}</TestName>
                  <TestStatus status={test.status}>{test.status}</TestStatus>
                </div>
              </TestHeader>

              <TestDescription>{test.description}</TestDescription>

              <TestMetrics>
                <TestMetric>
                  <MetricLabel>시작일</MetricLabel>
                  <MetricValue>{formatDate(test.startDate)}</MetricValue>
                </TestMetric>
                <TestMetric>
                  <MetricLabel>트래픽 할당</MetricLabel>
                  <MetricValue>{test.trafficAllocation}%</MetricValue>
                </TestMetric>
              </TestMetrics>

              <VariantsContainer>
                <VariantsTitle>변형 ({test.variants.length}개)</VariantsTitle>
                <VariantsList>
                  {test.variants.map((variant) => (
                    <VariantItem key={variant.id}>
                      <VariantName>{variant.name}</VariantName>
                      <VariantWeight>{variant.weight}%</VariantWeight>
                    </VariantItem>
                  ))}
                </VariantsList>
              </VariantsContainer>

              <TestActions>
                <ActionButton
                  variant="primary"
                  onClick={() => handleViewResults(test.id)}
                >
                  결과 보기
                </ActionButton>
                {test.status === 'active' && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => handlePauseTest(test.id)}
                  >
                    일시정지
                  </ActionButton>
                )}
                <ActionButton
                  variant="danger"
                  onClick={() => handleDeleteTest(test.id)}
                >
                  삭제
                </ActionButton>
              </TestActions>
            </TestCard>
          ))}
        </TestsGrid>
      )}
    </DashboardContainer>
  );
};