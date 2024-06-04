import { Spacing } from '@motion-canvas/core';
import { compound } from './compound';
import { wrapper } from './signal';
export function spacingSignal(prefix) {
    return (target, key) => {
        compound({
            top: prefix ? `${prefix}Top` : 'top',
            right: prefix ? `${prefix}Right` : 'right',
            bottom: prefix ? `${prefix}Bottom` : 'bottom',
            left: prefix ? `${prefix}Left` : 'left',
        })(target, key);
        wrapper(Spacing)(target, key);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BhY2luZ1NpZ25hbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZGVjb3JhdG9ycy9zcGFjaW5nU2lnbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFakMsTUFBTSxVQUFVLGFBQWEsQ0FBQyxNQUFlO0lBQzNDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDckIsUUFBUSxDQUFDO1lBQ1AsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSztZQUNwQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPO1lBQzFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVE7WUFDN0MsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTTtTQUN4QyxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyJ9