'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  emptyText?: string
  className?: string
  id?: string
  required?: boolean
  onEnterKey?: () => void
  onEscapeKey?: () => void
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  emptyText = 'No results found.',
  className,
  id,
  required,
  onEnterKey,
  onEscapeKey,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  const selectedOption = options.find((option) => option.value === value)

  // Reset search value when popover opens
  React.useEffect(() => {
    if (open) {
      setSearchValue('')
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !open) {
      e.preventDefault()
      e.stopPropagation()
      if (onEnterKey) {
        onEnterKey()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (open) {
        setOpen(false)
      } else if (onEscapeKey) {
        onEscapeKey()
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-background text-foreground h-8 md:h-9 text-xs md:text-sm',
            !value && 'text-muted-foreground',
            className
          )}
          onKeyDown={handleKeyDown}
        >
          {selectedOption?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) =>
                  option.label.toLowerCase().includes(searchValue.toLowerCase())
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      // Use the original option.value instead of the normalized currentValue from cmdk
                      onValueChange(option.value === value ? '' : option.value)
                      setOpen(false)
                      setSearchValue('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}