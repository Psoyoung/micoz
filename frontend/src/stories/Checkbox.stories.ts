import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../components/Checkbox/Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A checkbox component with support for indeterminate state and different sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Checkbox label text',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (mixed)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the checkbox',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Checkbox size',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Default checkbox',
  },
};

export const Checked: Story = {
  args: {
    label: 'Checked checkbox',
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Indeterminate checkbox',
    indeterminate: true,
    checked: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};

export const Small: Story = {
  args: {
    label: 'Small checkbox',
    size: 'small',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium checkbox',
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    label: 'Large checkbox',
    size: 'large',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled checked checkbox',
    disabled: true,
    checked: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Checkbox with error',
    error: true,
  },
};

export const ErrorChecked: Story = {
  args: {
    label: 'Error state checked',
    error: true,
    checked: true,
  },
};

export const LongLabel: Story = {
  args: {
    label: 'This is a very long label that demonstrates how the checkbox component handles longer text content and wrapping behavior',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Interactive: Story = {
  args: {
    label: 'Click to toggle',
    onChange: (checked: boolean) => {
      console.log('Checkbox toggled:', checked);
    },
  },
};