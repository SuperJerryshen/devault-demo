import { Button, Link, Input } from "@heroui/react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
} from "@/components/icons";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              className="flex justify-start items-center gap-1 text-foreground"
              href="/"
            >
              <Logo />
              <p className="font-bold text-inherit">ACME</p>
            </Link>
            <div className="hidden lg:flex gap-4 justify-start ml-8">
              {siteConfig.navItems.map((item) => (
                <Link
                  key={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary data-[active=true]:text-primary data-[active=true]:font-medium"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Link href={siteConfig.links.twitter}>
                <TwitterIcon className="text-default-500" />
              </Link>
              <Link href={siteConfig.links.discord}>
                <DiscordIcon className="text-default-500" />
              </Link>
              <Link href={siteConfig.links.github}>
                <GithubIcon className="text-default-500" />
              </Link>
              <ThemeSwitch />
            </div>
            <div className="hidden lg:flex">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-default-400 pointer-events-none flex-shrink-0" />
                <Input
                  aria-label="Search"
                  className="pl-10 bg-default-100"
                  placeholder="Search..."
                  type="search"
                />
              </div>
            </div>
            <div className="hidden md:flex">
              <Button
                className="text-sm font-normal text-default-600 bg-default-100"
                variant="secondary"
              >
                <a href={siteConfig.links.sponsor} className="flex items-center gap-2">
                  <HeartFilledIcon className="text-danger" />
                  Sponsor
                </a>
              </Button>
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <Link href={siteConfig.links.github}>
                <GithubIcon className="text-default-500" />
              </Link>
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
