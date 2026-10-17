# Bunker Seal ($BUNKY)

This repo is the source of the Bunker Seal site: https://timteh.github.io/bunkyseal/

Tim created $BUNKY & holds ~30.8% (incl. 21.48% locked: 20.48% till Jan 1, 2027 and 1.00% till Oct 31, 2026, 12:00 PM ET), as of Oct 17, 10:32 AM ET. Launched via QSPHINX. Not financial advice.

## The only mint

`GPojeXRcXthWBMWxWC6iY5TMjY8dLf25Q2Ft4kMVRwD4`

Other coins with similar names exist on Solana. Match every character of the address.

## How we count real holders

- A real holder is a wallet that holds at least 10,000 tokens.
- We leave out wallets that aren't outside holders: the pump.fun bonding curve, the Streamflow lock escrow, Tim's three disclosed wallets (4MJJ, C7QW, 5JSN) and the QSPHINX deployer.
- A stayer is an outside wallet that got its first tokens from the curve between 48 and 24 hours ago and still holds at least 10,000 tokens now. A wallet's first tokens have to be at least a day old before it can count, so this window runs a day behind.
- Counts come from public Solana RPC data. If a lookup fails, we record an error and leave the number blank. We never fill in a guess.

You can check how long an address has been holding in our daily snapshot on the hold-check page: https://timteh.github.io/bunkyseal/bunker/. The address is hashed in your browser and is not saved or sent.

## The lock

21.48% of supply is locked via Streamflow: 20.48% until Jan 1, 2027, and 1.00% until Oct 31, 2026, 12:00 PM ET (as of Oct 17, 10:32 AM ET). You can view the lock contract here:

https://app.streamflow.finance/contract/solana/mainnet/DB4acnCfvLX2ReYFn88ExkXXLXK12xYXjqSGimQxG8Ke

## Bot roles

- `og-decode` (GitHub Actions): when the share-card files in `play/og/` change, it decodes the images and checks each one against the sha256 list in `play/og/MANIFEST.txt`. It commits only images that match.
- `pfp-decode` (GitHub Actions): does the same for the profile badge in `pfp/`, checking against `pfp/MANIFEST.txt`.

Both workflows are in `.github/workflows/`.

## Safety

We never ask for keys or seeds.

Official accounts won't ask for keys, seeds or wallet connects. Ignore anyone who messages you offering help.

## Links

- Setup map: https://timteh.github.io/bunkyseal/start/
- Hold-check: https://timteh.github.io/bunkyseal/bunker/
