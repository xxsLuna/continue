import {
  Menu as HLMenu,
  MenuButton as HLMenuButton,
  MenuItem as HLMenuItem,
  MenuItems as HLMenuItems,
  Transition,
} from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import * as React from "react";
import { defaultBorderRadius, vscCommandCenterInactiveBorder } from "..";
import { cn } from "../../util/cn";
import { FontSizeModifier, useFontSize } from "./font";

const Menu = HLMenu;

type MenuButtonProps = React.ComponentProps<typeof HLMenuButton> & {
  fontSizeModifier?: FontSizeModifier;
};

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ fontSizeModifier = -3, ...props }, ref) => {
    const fontSize = useFontSize(fontSizeModifier);
    return (
      <HLMenuButton
        ref={ref}
        {...props}
        className={cn(
          "bg-vsc-input-background text-vsc-foreground border-border m-0 flex flex-1 cursor-pointer flex-row items-center gap-1 border border-solid px-1 py-0.5 text-left transition-colors duration-200",
          props.className,
        )}
        style={{
          fontSize,
          borderRadius: defaultBorderRadius,
          ...props.style,
        }}
      />
    );
  },
);

type MenuItemsProps = React.ComponentProps<typeof HLMenuItems> & {
  fontSizeModifier?: FontSizeModifier;
};

const MenuItems = React.forwardRef<HTMLDivElement, MenuItemsProps>(
  ({ fontSizeModifier = -3, ...props }, ref) => {
    const fontSize = useFontSize(fontSizeModifier);
    return (
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <HLMenuItems
          ref={ref}
          {...props}
          className={cn(
            "bg-vsc-input-background border-border flex w-max min-w-[160px] max-w-[400px] flex-col overflow-auto rounded-md border border-solid px-0 py-1 shadow-lg focus:outline-none",
            props.className,
          )}
          style={{
            fontSize,
            zIndex: 200000,
            ...props.style,
          }}
        />
      </Transition>
    );
  },
);

type MenuItemProps = React.ComponentProps<typeof HLMenuItem> & {
  fontSizeModifier?: FontSizeModifier;
};

const MenuItem = React.forwardRef<React.ElementType, MenuItemProps>(
  ({ fontSizeModifier = -3, ...props }, ref) => {
    const fontSize = useFontSize(fontSizeModifier);
    return (
      <HLMenuItem
        ref={ref}
        {...props}
        className={cn(
          "text-foreground data-[focus]:bg-list-active data-[focus]:text-list-active-foreground group flex w-full cursor-pointer select-none items-center justify-between px-2 py-1",
          props.className,
        )}
        style={{
          fontSize,
          ...props.style,
        }}
      />
    );
  },
);

// Helper for sub-menu
const SubMenu = ({
  label,
  icon: Icon,
  children,
  className,
  disabled,
}: {
  label: React.ReactNode;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <HLMenu as="div" className="relative">
      <HLMenuButton
        disabled={disabled}
        className={cn(
          "text-foreground data-[focus]:bg-list-active data-[focus]:text-list-active-foreground group flex w-full cursor-pointer select-none items-center justify-between px-2 py-1 disabled:opacity-50",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3 w-3" />}
          <span>{label}</span>
        </div>
        <ChevronRightIcon className="h-3 w-3 opacity-50" />
      </HLMenuButton>
      <HLMenuItems
        anchor="right start"
        className="bg-vsc-input-background border-border ml-1 flex w-max min-w-[160px] max-w-[400px] flex-col overflow-auto rounded-md border border-solid py-1 shadow-lg focus:outline-none"
        style={{ zIndex: 200001 }}
      >
        {children}
      </HLMenuItems>
    </HLMenu>
  );
};

export { Menu, MenuButton, MenuItem, MenuItems, SubMenu };
