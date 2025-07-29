import type { Meta, StoryObj } from '@storybook/react';
import { Radio, SingleRadio } from '../components/Radio/Radio';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Radio button components for single-selection scenarios.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Radio group name',
    },
    value: {
      control: 'text',
      description: 'Selected value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all radio buttons',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Radio button size',
    },
    direction: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Layout direction',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

const sizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const paymentOptions = [
  { value: 'credit', label: 'Credit Card' },
  { value: 'debit', label: 'Debit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bank', label: 'Bank Transfer', disabled: true },
];

const planOptions = [
  { value: 'basic', label: 'Basic Plan - $9/month' },
  { value: 'pro', label: 'Pro Plan - $19/month' },
  { value: 'enterprise', label: 'Enterprise Plan - $49/month' },
];

export const Default: Story = {
  args: {
    name: 'size',
    options: sizeOptions,
  },
};

export const WithSelectedValue: Story = {
  args: {
    name: 'payment',
    options: paymentOptions,
    value: 'credit',
  },
};

export const Horizontal: Story = {
  args: {
    name: 'plan',
    options: planOptions,
    direction: 'horizontal',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Small: Story = {
  args: {
    name: 'size-small',
    options: sizeOptions,
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    name: 'size-large',
    options: sizeOptions,
    size: 'large',
  },
};

export const Disabled: Story = {
  args: {
    name: 'disabled',
    options: sizeOptions,
    disabled: true,
    value: 'medium',
  },
};

export const WithError: Story = {
  args: {
    name: 'error',
    options: paymentOptions,
    error: true,
  },
};

export const WithDisabledOptions: Story = {
  args: {
    name: 'mixed',
    options: paymentOptions,
    value: 'credit',
  },
};

// Single Radio Button Stories
const singleRadioMeta = {
  title: 'Components/SingleRadio',
  component: SingleRadio,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Individual radio button component for custom layouts.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SingleRadio>;

export const SingleDefault: StoryObj<typeof SingleRadio> = {
  render: (args) => <SingleRadio {...args} />,
  args: {
    name: 'single',
    value: 'option1',
    label: 'Single radio option',
  },
};

export const SingleChecked: StoryObj<typeof SingleRadio> = {
  render: (args) => <SingleRadio {...args} />,
  args: {
    name: 'single-checked',
    value: 'option1',
    label: 'Checked radio option',
    checked: true,
  },
};

export const SingleWithoutLabel: StoryObj<typeof SingleRadio> = {
  render: (args) => <SingleRadio {...args} />,
  args: {
    name: 'single-no-label',
    value: 'option1',
  },
};

export const SingleDisabled: StoryObj<typeof SingleRadio> = {
  render: (args) => <SingleRadio {...args} />,
  args: {
    name: 'single-disabled',
    value: 'option1',
    label: 'Disabled radio option',
    disabled: true,
    checked: true,
  },
};