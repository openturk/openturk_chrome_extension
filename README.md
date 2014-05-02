# Openturk Chrome Extension
Your personal mturk assistant for HIT recommendation
It also manages you requesters, search terms, and syncronizes your preferences to openturk.com

## Installation

### Stable

1. Go to the [extension page](https://chrome.google.com/webstore/detail/openturk/kjcgglnfcafddffbkghnlhongefbcjil/) on the Chrome Web Store
2. Click 'Add to Chrome'

### Development

1. `git clone https://github.com/openturk/openturk_chrome_extension.git`
2. Open Chrome, and browse to your extensions list
3. Check the 'Developer mode' checkbox
4. Click 'Load unpacked extension'
5. Find the folder you just cloned and save

## Setup

1. Login to you mturk account
2. Click the Openturk browser button
3. Click "Use Openturk"
4. Optionally: login to your openturk account (http://alpha.openturk.com) to get recommendations and synchronize your preferences

## Changlog

- 0.4.3-0.4.8: Progress on fixing the favorites synchronization issue.
- 0.4.2: Temporarily switch to chrome.storage.local the sync function of Chrome seems buggy.
- 0.4.1: Add the option to open notifications links in new tabs (true by default)
- 0.4: Initial release
- < 0.4: Pre Alpha 