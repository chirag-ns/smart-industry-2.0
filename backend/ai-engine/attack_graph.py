def build_attack_path(source, devices):
    path = []
    for device in devices:
        if device.get("deviceId") != source:
            path.append({
                "from": source,
                "to": device.get("deviceId"),
                "type": "potential_lateral_movement"
            })
    return path
