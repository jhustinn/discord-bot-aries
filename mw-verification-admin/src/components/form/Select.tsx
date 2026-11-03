import React from "react";
import CustomSelect, { CustomSelectOption, CustomSelectProps } from "../ui/select/CustomSelect";

export interface Option extends Partial<CustomSelectOption> {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<CustomSelectProps, 'options' | 'onChange' | 'value'> {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
}

const Select: React.FC<SelectProps> = ({
  options = [],
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  ...rest
}) => {
  const currentValue = value !== undefined ? value : defaultValue;

  return (
    <CustomSelect
      options={options as CustomSelectOption[]}
      value={currentValue}
      onChange={(val) => onChange(val)}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
};

export default Select;
export * from "../ui/select/CustomSelect";
