# Python script to merge specified ArkusPay files into a single `testmerge.txt`
import os

# List of file paths to merge (relative to the ArkusPay project root)
# These paths are derived from the detailed ArkusPay integration plan.
file_paths = [
    "app/merchant/verify-identity/page.tsx",  # ArkusPay specific path
    "app/verify-email/page.tsx",            # ArkusPay specific path
    "components/layouts/DashLayout.tsx",
    "hooks/useApiRequest.ts",
    "types/index.ts",
    "types/user.ts",                          # Assuming this is a file based on description
    "types/merchant.ts",                      # Assuming this is a file based on description
    "types/verification.ts",                  # Assuming this is a file based on description
    "app/merchant/page.tsx",                  # ArkusPay specific path
    "app/merchant/settings/page.tsx",
    "components/ui/ProfileSettingsTab.tsx",   # Or other relevant setting tabs
    "components/ui/EmailVerificationPrompt.tsx",
    "components/ui/IdentityVerificationStatusAlert.tsx",
    "components/ui/DocumentUploadField.tsx",
    "consts/paths.ts",
    "middleware.ts",
    # Referenced RiskPay files (if you want to include their content assuming they exist in a similar path for reference)
    # "src/app/merchant/verify-identity/page.tsx", # RiskPay reference
    # "src/components/EmailVerification.tsx",      # RiskPay reference
]

# Remove duplicates while preserving order and normalize paths
seen = set()
unique_file_paths = []
for path in file_paths:
    normalized_path = os.path.normpath(path)
    if normalized_path not in seen:
        seen.add(normalized_path)
        unique_file_paths.append(path) # Use original path for file opening

output_file = "arkuspay_verification_merge.txt" # Changed output file name for clarity

with open(output_file, "w", encoding="utf-8") as outfile:
    for path in unique_file_paths:
        outfile.write(f"// File: {path}\n\n")
        try:
            # Ensure these paths are correct relative to where you run the script
            # or the root of the ArkusPay project.
            with open(path, "r", encoding="utf-8") as infile:
                outfile.write(infile.read())
        except FileNotFoundError:
            outfile.write(f"// Warning: File not found at '{path}'. Please ensure the path is correct relative to the script's execution directory or provide the full path.\n")
        except Exception as e: # Catch other potential errors
            outfile.write(f"// Error reading {path}: {e}\n")
        outfile.write("\n\n")

print(f"All specified ArkusPay contents have been merged into `{output_file}`.")
print(f"Processed {len(unique_file_paths)} unique file paths.")