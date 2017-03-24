# Openturk Chrome Extension
Your personal MTurk assistant for HIT recommendation
It also manages you requesters, search terms, and syncronizes your preferences to openturk.com

March 2017: We are aware of the technical difficulties some Openturk users currently have. This is bacause of changes in the Facebook API and MTurk page structure. We will provide an update to fix these issues and add new HIT recommendation functionalities soon.

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
- 0.5.1: Adapt to the change introduced by mturk.
- 0.5.0: Better recommendations page.
- 0.4.9: Enhancing the login/logout mturk detection.
- 0.4.3-0.4.8: Progress on fixing the favorites synchronization issue.
- 0.4.2: Temporarily switch to chrome.storage.local the sync function of Chrome seems buggy.
- 0.4.1: Add the option to open notifications links in new tabs (true by default)
- 0.4: Initial release
- < 0.4: Pre Alpha 

## Roadmap (updated March 2017)
- Fix broken Facebook signin/signup
- Fix HIT recommendation tab ('Hot') in the extension
- Fix the 'Recommend me a HIT' button on the MTurk HIT page
- Add HIT recommendation based on collaborative filtering algorithms
- Add new HIT recommendation algorithms based on requester reputation data
- Add a worker visual analytics dashboard to present personal historical activities and break it down by task type over time
