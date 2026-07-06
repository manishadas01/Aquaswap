'use client'
import Link from 'next/link'
import { Menu, X, Palette, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@/components/ConnectButton'
import React from 'react'
import { useScroll, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
    { name: 'Swap', href: '/' },
    { name: 'Pools', href: '/pool' },
    { name: 'Docs', href: 'https://github.com' },
    { name: 'Explorer', href: 'https://stellar.expert/explorer/testnet' },
]

const colorPresets = {
    ocean: ["#0B3D91", "#1C6DD0", "#3AAED8", "#8FE3CF"],
    teal: ["#013A63", "#01497C", "#2A6F97", "#61A5C2"],
    indigo: ["#4E56C0", "#9B5DE0", "#D78FEE", "#FDCFFA"],
    sunset: ["#7C444F", "#9F5255", "#E16A54", "#F39E60"],
    mint: ["#0D4F4B", "#1B7A6E", "#3FA796", "#8FE3CF"],
}

type HeroHeaderProps = {
    onColorPresetChange?: (colors: string[]) => void
}

export const HeroHeader = ({ onColorPresetChange }: HeroHeaderProps) => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { scrollYProgress } = useScroll()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    const handleColorPresetChange = (preset: keyof typeof colorPresets) => {
        if (onColorPresetChange) {
            onColorPresetChange(colorPresets[preset])
        }
    }

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full pt-2 px-4">
                <div className={cn('mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12', scrolled && 'bg-black/50 backdrop-blur-2xl')}>
                    <motion.div
                        key={1}
                        className={cn('relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6', scrolled && 'lg:py-4')}>
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link href="/" className="flex items-center gap-2 text-white">
                                <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                                    <Droplets className="size-4" />
                                </span>
                                <span className="text-lg font-semibold tracking-tight">AquaSwap</span>
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 text-white duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 text-white opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-white/70 hover:text-white block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-black/80 backdrop-blur-xl in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-white/70 hover:text-white block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-center gap-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/20 text-white">
                                            <Palette className="h-5 w-5" />
                                            <span className="sr-only">Change color preset</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/20 text-white">
                                        {Object.entries(colorPresets).map(([key, value]) => (
                                            <DropdownMenuItem
                                                key={`preset-${key}`}
                                                onClick={() => handleColorPresetChange(key as keyof typeof colorPresets)}
                                                className="focus:bg-white/10 focus:text-white cursor-pointer capitalize">
                                                <div className="rounded-full size-4" style={{ backgroundColor: value[1] }} />
                                                {key}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <ConnectButton />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </nav>
        </header>
    )
}
