import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
const variants = cva('button', {variants: {variant: {default: 'button-primary', outline: 'button-outline', ghost: 'button-ghost'}, size: {default: '', icon: 'button-icon', small: 'button-small'}}, defaultVariants: {variant: 'outline', size: 'default'}});
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & {asChild?: boolean};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({className, variant, size, asChild = false, ...props}, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} title={props.title??props['aria-label']} className={twMerge(clsx(variants({variant, size}), className))} {...props}/>;
});
Button.displayName = 'Button';
