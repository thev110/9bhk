"use client";

import { OTPInput, type SlotProps } from "input-otp";
import { useT } from "@/lib/i18n";

export function OtpField({
  value,
  onChange,
  maxLength = 6,
  onComplete,
}: {
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  onComplete?: (val: string) => void;
}) {
  const t = useT();
  return (
    <OTPInput
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      containerClassName="otp-container"
      render={({ slots }) => (
        <div className="otp-group" role="group" aria-label={t("a11y.otpGroup")}>
          {slots.map((slot, idx) => (
            <OtpSlot key={idx} {...slot} />
          ))}
        </div>
      )}
    />
  );
}

function OtpSlot(props: SlotProps) {
  return (
    <div className={`otp-slot${props.isActive ? " is-active" : ""}${props.char ? " has-char" : ""}`}>
      {props.char !== null ? props.char : ""}
      {props.hasFakeCaret && <span className="otp-caret" aria-hidden />}
    </div>
  );
}
