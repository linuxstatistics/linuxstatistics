---
title: "How we rank Linux distros"
description: "The four signals behind our index, how much each one counts, and why we call it interest, not installs."
published: 2026-11-18
topic: data
type: analysis
---


Every distro on LinuxStatistics has one rank. It comes from our own index, which blends several public signals of interest so that no single website decides the chart. This article explains what goes in, how it's combined and what the number does and doesn't tell you.

## What we measure: interest, not installs

Nobody publishes install numbers for Linux as a whole. Most distros don't count their users, and the few that do, such as Fedora's [DNF "countme"](https://fedoraproject.org/wiki/Changes/DNF_Better_Counting) or Debian's opt-in [popularity-contest](https://popcon.debian.org/), count in different ways that can't be compared. So we don't pretend to rank by usage.

Instead we rank by **interest**: how much attention a distro gets across several places people look things up. That's useful when you're choosing, because interest goes with documentation, forum answers and people who can help. It isn't the same as quality or popularity on desktops, and a news story can move it.

## The four signals

| Signal | What it counts | Weight |
|---|---|---|
| Wikipedia views | Daily views of the distro's English Wikipedia article, last 12 months | 50% |
| DistroWatch | Its 12-month page-hit ranking, credited as one input | 30% |
| GitHub stars | Stars on the distro's main repository, where it has one | 10% |
| Views here | Views of the distro's page on LinuxStatistics, last 90 days | 10% |

**Wikipedia views** carry the most weight because they're public, long-running and hard for one project to push around. They come from the [Wikimedia pageviews API](https://wikimedia.org/api/rest_v1/).

**[DistroWatch](https://distrowatch.com/dwres.php?resource=popularity)** has tracked distro page hits for over twenty years. We use its 12-month ranking as one credited input while our own signals grow, and we don't republish its numbers.

**GitHub stars** show developer attention. Many distros don't develop on GitHub, so this signal covers only those that do.

**Views on this site** count each time someone opens a distro's page here. Bots are filtered, and nothing about the visitor is stored. It's our smallest input, so our own traffic can't decide the chart.

## From signals to one rank

Each signal ranks the distros it covers. We turn each position into a score between 1 (first place) and just above 0 (last place). A distro that a signal doesn't cover scores 0 for that signal.

Then we multiply each score by its weight, add them up, and rank the totals. The number shown as "Index" next to each distro is that total, so a higher index means more interest across the signals.

An example: a distro that leads on Wikipedia but shows up in no other signal scores 0.5. A distro that sits around 20th on Wikipedia, DistroWatch and views here, with no GitHub repository, scores about 0.87, so it ranks higher. Steady interest in several places beats a spike in one.

## What "Rising" means

The [Rising](/rising/) page uses the same signals over the last month instead of the last 12 months, and shows the distros that climbed the most. A big jump usually means a new release, a news story or a popular video, so check the distro page before reading much into it.

## How often it changes

The index is rebuilt every month when new Wikipedia figures arrive, and the other inputs refresh between daily and monthly. If a source fails, we keep its last good data instead of showing gaps.

The weights live in one place in our [source code](https://github.com/linuxstatistics/linuxstatistics/blob/main/packages/shared/src/weights.ts) and change only in a reviewed commit, published on our [About page](/about/#ranking).

## What it can't tell you

- **Which distro is best for you.** That depends on your hardware and what you do. The [quiz](/pick/) asks the questions that matter.
- **How many people use a distro.** No one has that number for Linux as a whole, let alone per distro.
- **Quality.** A small, well-made distro can rank low because few people have heard of it yet.

For Linux as a whole, the closest thing to usage we show is [desktop share](/desktop-share/) from StatCounter. In October 2026 it was 5.66% of desktops worldwide.

## The data is open

You can download our distro list, facts and desktop share figures from [Open data](/data/), and see the totals on [Linux by the numbers](/stats/). If you think a distro is missing or a fact is wrong, [tell us](/suggest/).
