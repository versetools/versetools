try:
    from pyvistaqt import QtInteractor
    import pyvista as pv
    from pyvista import examples

    cubemap = examples.download_cubemap_space_16k()

    class ObjectContainerPlotter(QtInteractor):
        def __init__(self, object_container, depth_to_show=1, label_font_size=48, point_max_size=48,
                     *args, **kwargs):
            self.object_container = object_container
            self.depth_to_show = depth_to_show
            self.label_font_size = label_font_size
            self.point_max_size = point_max_size

            super().__init__(*args, **kwargs)

            # self.plotter = plotter or Plotter(*args, **kwargs)
            # self.plotter.add_key_event('r', self._handle_reset_view)
            # self.plotter.enable_fly_to_right_click()
            # self.plotter.enable_point_picking(self._handle_clicked_point, show_message=False, left_clicking=True)


            self.add_key_event('r', self._handle_reset_view)
            self.enable_fly_to_right_click()
            self.enable_point_picking(self._handle_clicked_point, show_message=False, left_clicking=True)

            self._oc_from_point = {}
            self._parent_oc = [self.object_container]

            self._update_plotter()

        def _handle_reset_view(self):
            self.reset_camera()

        def _handle_clicked_point(self, point):
            self.fly_to(point)
            if oc := self._oc_from_point.get(tuple(point)):
                self._update_plotter(oc)

        def _handle_button_clicked(self, _):
            if not self._parent_oc:
                self._parent_oc = [self.object_container]
            else:
                self._parent_oc.pop()
            self._update_plotter(self._parent_oc[-1])

        def _update_plotter(self, base_oc=None):
            base_oc = base_oc or self.object_container

            self.clear()
            self._oc_from_point.clear()
            self.add_actor(cubemap.to_skybox())
            self.set_environment_texture(cubemap, True)

            if base_oc is not self.object_container:
                if base_oc not in self._parent_oc:
                    self._parent_oc.append(base_oc)
                self.add_checkbox_button_widget(self._handle_button_clicked, value=True)

            points_at_size = {}

            def add_children(obj, d, s):
                if d < 0:
                    return
                name = getattr(obj, 'display_name', obj.name)
                point = tuple(getattr(obj, 'universal_position', (0, 0, 0)))
                self._oc_from_point[point] = obj
                points_at_size.setdefault(s, []).append((point, name))
                for child in obj.children.values():
                    add_children(child, d - 1, max(5, s - 10))

            self.add_text(getattr(base_oc, 'display_name', base_oc.name))
            add_children(base_oc, d=max(self.depth_to_show, 1), s=self.point_max_size)

            for size in points_at_size:
                points, names = zip(*points_at_size[size])
                self.add_point_labels(points, names, font_size=self.label_font_size, pickable=True,
                                      reset_camera=True, point_size=size, shape='rounded_rect')
            # self.show_bounds()
            # plotter.enable_joystick_style()
            # self.show_grid()

except ImportError:
    class ObjectContainerPlotter:
        def __init__(self):
            from pyvista import Plotter  # trigger import error
