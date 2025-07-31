import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { shippingService, TrackingInfo, formatShippingStatus, getEstimatedDeliveryText, formatTrackingNumber } from '../../services/shippingService';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TrackingCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const TrackingHeader = styled.div`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[6]};
`;

const TrackingNumber = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[2]};
    text-align: center;
  }
`;

const TrackingNumberLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  opacity: 0.9;
`;

const TrackingNumberValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-family: monospace;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  
  ${({ status, theme }) => {
    const colors = {
      preparing: { bg: theme.colors.yellow[100], text: theme.colors.yellow[800] },
      shipped: { bg: theme.colors.blue[100], text: theme.colors.blue[800] },
      in_transit: { bg: theme.colors.purple[100], text: theme.colors.purple[800] },
      out_for_delivery: { bg: theme.colors.indigo[100], text: theme.colors.indigo[800] },
      delivered: { bg: theme.colors.green[100], text: theme.colors.green[800] },
      exception: { bg: theme.colors.red[100], text: theme.colors.red[800] }
    };
    
    const color = colors[status as keyof typeof colors] || colors.preparing;
    return `
      background: ${color.bg};
      color: ${color.text};
    `;
  }}
`;

const StatusIcon = styled.span`
  font-size: 16px;
`;

const DeliveryInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[2]};
    text-align: center;
  }
`;

const DeliveryText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  opacity: 0.9;
`;

const CompanyName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TrackingContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const RecipientInfo = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const RecipientTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const RecipientDetails = styled.div`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const TrackingHistory = styled.div`
  position: relative;
`;

const HistoryTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const HistoryTimeline = styled.div`
  position: relative;
  padding-left: ${({ theme }) => theme.spacing[8]};

  &::before {
    content: '';
    position: absolute;
    left: 16px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const HistoryItem = styled(motion.div)<{ isLatest: boolean }>`
  position: relative;
  padding-bottom: ${({ theme }) => theme.spacing[6]};
  
  &::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ isLatest, theme }) => 
      isLatest ? theme.colors.primary.sage : theme.colors.gray[300]};
    border: 3px solid white;
    box-shadow: 0 0 0 3px ${({ isLatest, theme }) => 
      isLatest ? theme.colors.primary.sage + '30' : 'transparent'};
  }

  &:last-child {
    padding-bottom: 0;
  }
`;

const HistoryTimestamp = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const HistoryLocation = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const HistoryDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary.sage};
  border-radius: 50%;
  margin: ${({ theme }) => theme.spacing[8]} auto;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.red[600]};
  background: ${({ theme }) => theme.colors.red[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin: ${({ theme }) => theme.spacing[4]} 0;
`;

const RefreshButton = styled.button`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing[4]};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateY(-2px);
  }
`;

interface OrderTrackingProps {
  trackingNumber: string;
  onClose?: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ trackingNumber, onClose }) => {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await shippingService.trackShipment(trackingNumber);
      setTrackingInfo(info);
    } catch (err) {
      setError('배송 정보를 불러오는데 실패했습니다.');
      console.error('Failed to fetch tracking info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingNumber) {
      fetchTrackingInfo();
    }
  }, [trackingNumber]);

  const formatTimestamp = (timestamp: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      preparing: '📦',
      shipped: '🚚',
      in_transit: '🛣️',
      out_for_delivery: '🏃‍♂️',
      delivered: '✅',
      exception: '⚠️'
    };
    return icons[status as keyof typeof icons] || '📦';
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>배송 조회</Title>
        </Header>
        <LoadingSpinner
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </Container>
    );
  }

  if (error || !trackingInfo) {
    return (
      <Container>
        <Header>
          <Title>배송 조회</Title>
        </Header>
        <ErrorMessage>
          {error || '배송 정보를 찾을 수 없습니다.'}
          <RefreshButton onClick={fetchTrackingInfo}>
            다시 시도
          </RefreshButton>
        </ErrorMessage>
      </Container>
    );
  }

  const statusInfo = formatShippingStatus(trackingInfo.status);

  return (
    <Container>
      <Header>
        <Title>배송 조회</Title>
      </Header>

      <TrackingCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <TrackingHeader>
          <TrackingNumber>
            <div>
              <TrackingNumberLabel>운송장 번호</TrackingNumberLabel>
              <br />
              <TrackingNumberValue>
                {formatTrackingNumber(trackingInfo.trackingNumber)}
              </TrackingNumberValue>
            </div>
            <StatusBadge status={trackingInfo.status}>
              <StatusIcon>{getStatusIcon(trackingInfo.status)}</StatusIcon>
              {statusInfo.text}
            </StatusBadge>
          </TrackingNumber>

          <DeliveryInfo>
            <DeliveryText>
              {trackingInfo.estimatedDelivery && 
                getEstimatedDeliveryText(trackingInfo.estimatedDelivery)
              }
            </DeliveryText>
            <CompanyName>{trackingInfo.shippingCompany}</CompanyName>
          </DeliveryInfo>
        </TrackingHeader>

        <TrackingContent>
          <RecipientInfo>
            <RecipientTitle>배송지 정보</RecipientTitle>
            <RecipientDetails>
              <div><strong>{trackingInfo.recipient.name}</strong></div>
              <div>{trackingInfo.recipient.address}</div>
              <div>{trackingInfo.recipient.phone}</div>
            </RecipientDetails>
          </RecipientInfo>

          <TrackingHistory>
            <HistoryTitle>배송 진행 상황</HistoryTitle>
            <HistoryTimeline>
              {trackingInfo.history.map((event, index) => (
                <HistoryItem
                  key={index}
                  isLatest={index === 0}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <HistoryTimestamp>
                    {formatTimestamp(event.timestamp)}
                  </HistoryTimestamp>
                  <HistoryLocation>{event.location}</HistoryLocation>
                  <HistoryDescription>{event.description}</HistoryDescription>
                </HistoryItem>
              ))}
            </HistoryTimeline>
          </TrackingHistory>

          <RefreshButton onClick={fetchTrackingInfo}>
            새로고침
          </RefreshButton>
        </TrackingContent>
      </TrackingCard>
    </Container>
  );
};