---
title: "Nobody knows how many people use each Linux distro"
description: "Why there are no install counts for Linux distros, what popularity charts actually measure, and how to cite our numbers honestly."
published: 2026-11-18
topic: data
type: analysis
---

Nobody publishes how many people run each Linux distribution, and nobody can. Linux has no central store, no required account and no shared telemetry, and most distros send nothing home at all. Every "most popular distro" chart, including ours, measures interest: how many people look at, read about or star a project. That is useful, but it is not usage.

## Why there are no install numbers

A Windows or macOS install checks in with one company. A Linux install doesn't. You can download an image from a mirror, copy it to ten machines and never contact the project again. Of the [51 distros we checked](/telemetry/), 31 send no usage data by default and 9 more only send it if you agree. The few that count installs do it differently, publish it rarely, and can't see machines that turned counting off.

So any single number that claims to be "Linux distro market share" is a guess dressed up as a measurement.

## What the popular charts measure

- **Page hits on one website.** DistroWatch's well-known ranking counts visits to each distro's page on DistroWatch. A news link, a bot or one project's fans can move a distro a long way. DistroWatch says so itself.
- **Search interest.** Search trends show what people look up, which mixes curiosity, troubleshooting and news.
- **Desktop share.** [StatCounter](/desktop-share/) estimates Linux as a whole from web traffic. It doesn't split by distro, and some Linux browsers report themselves as other systems.

## What our index measures

[Our index](/about/#ranking) combines four kinds of attention so that no single website decides the order: English Wikipedia article views (50%), DistroWatch's 12-month page-hit rank (30%), GitHub stars on the main repository (10%) and views of the distro's page on this site (10%). The weights are published, and every change to them is recorded in the [changelog](/changelog/).

Each signal has blind spots. Wikipedia favours distros with English articles; GitHub stars favour projects that develop on GitHub; our own page views favour distros people find through us. Combining them makes any one blind spot matter less. It doesn't turn interest into installs.

[chart: top 10]

## How to cite our numbers

Say what the number is. "Linux Mint ranked first on the LinuxStatistics interest index over the 12 months to November 2026" is accurate. "Linux Mint is the most used Linux distro" is not something anyone can know.

Our [open data](/data/) is free to reuse under CC BY 4.0 with a link back. Rankings themselves stay on our pages, because one of their inputs is another site's data.

## What would actually measure use

Real usage numbers need people to report them. That is why we're building first-party ways to count: an "I use this" button on distro pages, and an annual survey with open results. Until those numbers are large enough to mean something, we'll keep calling the chart what it is.
