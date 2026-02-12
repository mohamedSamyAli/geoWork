import { useState, useRef } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAddSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreate: (name: string) => Promise<{ data?: { id: string; name: string }; error?: any }>;
  options: Array<{ id: string; name: string }>;
}

export function QuickAddSelect({
  value,
  onChange,
  placeholder = "Select or type to add...",
  disabled = false,
  onCreate,
  options,
}: QuickAddSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.name === value);
  const exactMatch = options.find(
    (opt) => opt.name.toLowerCase() === inputValue.toLowerCase()
  );

  const filteredOptions = inputValue
    ? options.filter((opt) =>
        opt.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  async function handleCreateNew() {
    if (!inputValue.trim()) return;

    setIsCreating(true);
    const result = await onCreate(inputValue.trim());
    setIsCreating(false);

    if (result.data) {
      onChange(result.data.name);
      setInputValue("");
      setOpen(false);
    }
  }

  function handleSelect(optionName: string) {
    onChange(optionName);
    setInputValue("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && inputValue.trim() && !exactMatch) {
      e.preventDefault();
      handleCreateNew();
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {value ? value : placeholder}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-1">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search or add..."
              onKeyDown={handleKeyDown}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {inputValue.trim() ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>Press Enter to add &quot;{inputValue}&quot;</span>
                    <Plus className="h-4 w-4" />
                  </div>
                ) : (
                  "No options found."
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.name)}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === option.name ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {option.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {inputValue.trim() && !exactMatch && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="flex w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create &quot;{inputValue}&quot;
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
