import { Vector2, clamp } from '@motion-canvas/core';
export function getPointAtDistance(profile, distance) {
    const clamped = clamp(0, profile.arcLength, distance);
    let length = 0;
    for (const segment of profile.segments) {
        const previousLength = length;
        length += segment.arcLength;
        if (length >= clamped) {
            const relative = (clamped - previousLength) / segment.arcLength;
            return segment.getPoint(clamp(0, 1, relative));
        }
    }
    return { position: Vector2.zero, tangent: Vector2.up, normal: Vector2.up };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0UG9pbnRBdERpc3RhbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9jdXJ2ZXMvZ2V0UG9pbnRBdERpc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFJbkQsTUFBTSxVQUFVLGtCQUFrQixDQUNoQyxPQUFxQixFQUNyQixRQUFnQjtJQUVoQixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsS0FBSyxNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1FBQ3RDLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUM5QixNQUFNLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUM1QixJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUU7WUFDckIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUNoRSxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUNoRDtLQUNGO0lBRUQsT0FBTyxFQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFDLENBQUM7QUFDM0UsQ0FBQyJ9