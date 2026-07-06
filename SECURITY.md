# Security Policy

## Supported Versions
Only the latest version of the smart contracts and frontend is supported for security updates.

## Reporting a Vulnerability
If you discover a security vulnerability in this project, please report it privately to the maintainers. Do not open a public issue.

## Smart Contract Audit
A preliminary audit has been conducted, checking for:
- Reentrancy
- Integer overflow/underflow (prevented natively in Rust/Soroban)
- Proper access control for administrative functions
- Invariant validation for AMM pools
