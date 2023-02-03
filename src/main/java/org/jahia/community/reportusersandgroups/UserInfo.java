package org.jahia.community.reportusersandgroups;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class UserInfo {

    private final String name;
    private final String site;
    private final List<String> groups = new ArrayList<>();
    private final Map<String, String> properties = new HashMap<>();

    public UserInfo(String site, String name) {
        this.site = site;
        this.name = name;
    }

    public List<String> getGroups() {
        return Collections.unmodifiableList(groups);
    }

    public void addProperty(String key, String value) {
        properties.put(key, value);
    }

    public Set<String> getPropertiesKeySet() {
        return properties.keySet();
    }

    public boolean containsPropertyKey(String key) {
        return properties.containsKey(key);
    }

    public String getProperty(String key) {
        return properties.get(key);
    }

    public void addGroup(String group) {
        groups.add(group);
    }

    public String getName() {
        return name;
    }

    public String getSite() {
        return site;
    }

}
