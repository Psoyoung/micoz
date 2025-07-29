import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../components/Card/Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with different variants and hover effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined'],
      description: 'Card style variant',
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'small', 'medium', 'large'],
      description: 'Card padding size',
    },
    hover: {
      control: 'boolean',
      description: 'Enable hover effects',
    },
    clickable: {
      control: 'boolean',
      description: 'Make card clickable',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Card Title</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>This is a default card with some content inside.</p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Elevated Card</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>This card has more prominent shadow elevation.</p>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Outlined Card</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>This card has a visible border instead of shadow.</p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'small',
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Small Padding</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>This card has small padding.</p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'large',
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Large Padding</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>This card has large padding for more spacious content.</p>
      </div>
    ),
  },
};

export const WithHover: Story = {
  args: {
    hover: true,
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Hover Card</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>Hover over this card to see the effect.</p>
      </div>
    ),
  },
};

export const Clickable: Story = {
  args: {
    clickable: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Clickable Card</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>Click this card to trigger an action.</p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C5F41' }}>Custom Content</h3>
        <p style={{ margin: 0, color: '#2B2B2B' }}>This card has no padding, allowing for custom content layout.</p>
      </div>
    ),
  },
};