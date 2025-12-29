import { Input, InputProps } from "@heroui/input";
import React from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function PasswordInput(
  props: Omit<InputProps, "type" | "endContent">
) {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      endContent={
        <button
          aria-label="toggle password visibility"
          className="focus:outline-solid outline-transparent w-6 h-6 cursor-pointer"
          type="button"
          onClick={toggleVisibility}
        >
          {isVisible ? (
            <EyeSlashIcon className="text-2xl text-default-400 pointer-events-none" />
          ) : (
            <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
          )}
        </button>
      }
    />
  );
}
