import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../components/Select/Select';

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A select dropdown component with customizable options and variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Select label text',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Select size',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'filled', 'outlined'],
      description: 'Select variant',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the select',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required field',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make select full width',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
];

const priorityOptions = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent', disabled: true },
];

export const Default: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Choose a country',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select your country',
  },
};

export const Required: Story = {
  args: {
    label: 'Priority Level',
    options: priorityOptions,
    placeholder: 'Select priority',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Category',
    options: countryOptions,
    placeholder: 'Select category',
    error: true,
    errorMessage: 'Please select a valid category',
  },
};

export const Filled: Story = {
  args: {
    label: 'Region',
    options: countryOptions,
    placeholder: 'Select region',
    variant: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Language',
    options: [
      { value: 'en', label: 'English' },
      { value: 'ko', label: '한국어' },
      { value: 'ja', label: '日本語' },
      { value: 'zh', label: '中文' },
    ],
    placeholder: 'Select language',
    variant: 'outlined',
  },
};

export const Small: Story = {
  args: {
    label: 'Size',
    options: [
      { value: 'xs', label: 'Extra Small' },
      { value: 's', label: 'Small' },
      { value: 'm', label: 'Medium' },
      { value: 'l', label: 'Large' },
    ],
    placeholder: 'Select size',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    label: 'Department',
    options: [
      { value: 'eng', label: 'Engineering' },
      { value: 'design', label: 'Design' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
    ],
    placeholder: 'Select department',
    size: 'large',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    options: countryOptions,
    placeholder: 'This is disabled',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Select',
    options: countryOptions,
    placeholder: 'This select takes full width',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' },
      { value: 'archived', label: 'Archived (Not Available)', disabled: true },
    ],
    placeholder: 'Select status',
  },
};