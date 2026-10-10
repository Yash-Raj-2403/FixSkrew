# FixSkrew sample cases (synthetic)

Five ready-made cases for the Tesla Model 3. Each folder holds what a technician would really bring to a job:
an **error log** from a scan tool, a **measurements** table, a **technician's problem statement** in their own words
and a **parts and service history**. Scenario 1 also has the voltage of all 96 cell groups.

> All data is invented to test FixSkrew. No file comes from a real vehicle, and the limits quoted by the
> knowledge base are those of the synthetic Model 3 test pack.

## How to use a case
1. Open the diagnosis page, set the vehicle to **Tesla Model 3** (or let it be detected).
2. Drag **every file in one folder** into *Case documents* (CSV, TXT, MD and JSON are supported).
3. Paste the question from `*technician-problem.md` into the chat, or ask your own.
4. Open the tabs: **Battery health** (readings and codes come from the files), **Battery map**, **Visual locator**
   (click *Locate on vehicle* under the answer), and **Investigation report**.

## What each case should show

| Folder | Codes | Expected leading suspects (ranked) | The point of the case |
|---|---|---|---|
| 01-weak-cell-group-module3 | P0B3C, P0A7F | Cell groups, voltage-sense connector, Battery module 3 | Balancing did not fix it: confirm under load, exclude the connector, then module 3 |
| 02-isolation-fault-after-wash | P0AA6 | Pack vent, pack enclosure, HV harness | Every branch is healthy, so the low insulation is on the pack side |
| 03-contactor-codes-weak-12v | P0ADD, P0AE2 | 12 V battery, contactors, HV junction box | Check the 12 V supply before replacing the junction box |
| 04-hot-modules-after-coolant-service | P0B3C | Cooling plate and coolant, coolant pump, cell groups | P0B3C is thermal here: bleed the air lock, do not replace a module |
| 05-dc-charging-aborts | none | DC fast-charge fuse, contactors, charging inlet | AC works and DC does not: the DC path |

Re-run the automatic check at any time (the backend must be running):

    node samples/verify.mjs            # all five cases
    node samples/verify.mjs 03         # one case
